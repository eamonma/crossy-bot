import {
  CommandInteraction,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
} from "discord.js"
import { Discord, Slash, SlashOption } from "discordx"
import { gql } from "graphql-request"
import { graphQLClient } from "../graphqlClient.js"
import createButton from "../utils/createViewLiveButton.js"
import { CrosswordGenesis } from "./genesis.js"

@Discord()
export abstract class Crossword {
  gameQuery: string = gql`
    query game($channelId: String!, $guildId: String!) {
      game(channelId: $channelId, guildId: $guildId) {
        id
        image
      }
    }
  `

  endGameMutation: string = gql`
    mutation endGame($channelId: String!, $guildId: String!) {
      endGame(channelId: $channelId, guildId: $guildId) {
        active
      }
    }
  `

  @Slash("isodate", { description: "Give the iso date" })
  async datetime(interaction: CommandInteraction): Promise<void> {
    const query = gql`
      {
        datetime
      }
    `

    await interaction.deferReply()

    const response = await graphQLClient.request(query)

    await interaction.editReply(response.datetime)
  }

  @Slash("link")
  async getLink(interaction: CommandInteraction): Promise<void> {
    let response

    await interaction.deferReply()

    try {
      response = await graphQLClient.request(this.gameQuery, {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
      })
    } catch (error: any) {
      if (error.response.errors.length) {
        interaction.editReply(error.response.errors[0].message)
        return
      }
    }

    if (!response) {
      interaction.editReply("Failed to show game. Please try again later")
    }

    const linkButton = createButton(response.game.id)

    const row = new MessageActionRow().addComponents(linkButton)

    await interaction.editReply({
      content: `Visit <https://crossy.me/game/${response.game.id}> for a live view.`,
      components: [row],
    })
  }

  @Slash("crossword", { description: "Show the crossword grid" })
  async show(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply()

    let response, crosswordData

    try {
      response = await graphQLClient.request(this.gameQuery, {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
      })
    } catch (error: any) {
      if (error.response.errors.length) {
        interaction.editReply(error.response.errors[0].message)
        return
      }
    }

    if (!response) {
      interaction.editReply("Failed to show game. Please try again later")
    }

    try {
      const bufferAttachmenet = Buffer.from(`${response.game.image}`, "base64")
      const attachment = new MessageAttachment(bufferAttachmenet, "output.png")

      interaction.editReply({ files: [attachment] })
    } catch (e: any) {
      interaction.editReply(e)
    }
  }
}
