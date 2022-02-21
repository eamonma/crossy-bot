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

@Discord()
export abstract class CrosswordGenesis {
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

  startGameMutation: string = gql`
    mutation startGame(
      $puzzleUrl: String!
      $guildId: String!
      $channelId: String!
    ) {
      startGame(
        puzzleUrl: $puzzleUrl
        guildId: $guildId
        channelId: $channelId
      ) {
        image
        id
      }
    }
  `

  @Slash("start", { description: "Start a crossword game" })
  async startGame(
    @SlashOption("link", {
      type: "STRING",
      description: "link to JSON of the puzzle",
    })
    puzzleUrl: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply()

    let response

    try {
      response = await graphQLClient.request(this.startGameMutation, {
        puzzleUrl,
        channelId: interaction.channelId,
        guildId: interaction.guildId,
      })
    } catch (error: any) {
      if (error.response.errors.length) {
        await interaction.editReply(error.response.errors[0].message)
        return
      }
    }

    if (!response) {
      await interaction.editReply(
        "Failed to start game. Please try again later"
      )
    }

    const bufferAttachmenet = Buffer.from(
      `${response.startGame.image}`,
      "base64"
    )
    const attachment = new MessageAttachment(bufferAttachmenet, "output.png")

    const linkButton = createButton(response.startGame.id)

    const row = new MessageActionRow().addComponents(linkButton)

    await interaction.editReply({ files: [attachment], components: [row] })
  }

  @Slash("end", { description: "End the current game in the channel" })
  async endGame(
    @SlashOption("confirm", {
      type: "STRING",
      description: 'Type "end the game now" to confirm premature end of game',
    })
    confirm: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply()

    if (confirm !== "end the game now") {
      await interaction.editReply("Game did not end.")
      return
    }

    let response

    try {
      response = await graphQLClient.request(this.endGameMutation, {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
      })
    } catch (error: any) {
      if (error.response.errors.length) {
        if (process.env.NODE_ENV === "development")
          await interaction.editReply(error.response.errors[0].message)

        await interaction.editReply("Failed to end game.")
        return
      }
    }

    if (!response) {
      await interaction.editReply("Failed to end game.")
      return
    }

    await interaction.editReply(
      "Game ended successfully. Games ended prematurely do not affect leaderboard positions."
    )
  }
}
