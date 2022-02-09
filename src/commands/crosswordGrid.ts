import {
  CommandInteraction,
  Integration,
  MessageAttachment,
  MessageEmbed,
} from "discord.js"
import { Discord, MetadataStorage, Slash, SlashOption } from "discordx"
import { Pagination } from "@discordx/pagination"
import axios from "axios"
import { client } from "../main"
import { request, gql } from "graphql-request"

@Discord()
export abstract class CrosswordGrid {
  gameQuery: string = gql`
    query game($channelId: String!, $guildId: String!) {
      game(channelId: $channelId, guildId: $guildId) {
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

    const response = await request("http://localhost:4000/api", query)

    await interaction.editReply(response.datetime)
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
      response = await request(
        "http://localhost:4000/api",
        this.endGameMutation,
        {
          channelId: interaction.channelId,
          guildId: interaction.guildId,
        }
      )
    } catch (error: any) {
      if (error.response.errors.length) {
        await interaction.editReply(error.response.errors[0].message)
        return
      }
    }

    if (!response) {
      await interaction.editReply("Failed to end game. Please try again later")
      return
    }

    await interaction.editReply("Game ended successfully.")
  }

  @Slash("start", { description: "Start a crossword game" })
  async startGame(
    @SlashOption("link", {
      type: "STRING",
      description: "link to JSON of the puzzle",
    })
    puzzleUrl: string,
    interaction: CommandInteraction
  ): Promise<void> {
    const query = gql`
    mutation {
      startGame(puzzleUrl: "${puzzleUrl}", guildId: "${interaction.guildId}", channelId: "${interaction.channelId}") {
        image
      }
    }
  `

    await interaction.deferReply()

    let response

    try {
      response = await request("http://localhost:4000/api", query)
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

    await interaction.editReply({ files: [attachment] })
  }

  @Slash("crossword", { description: "Show the crossword grid" })
  async show(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply()

    let response, crosswordData

    try {
      response = await request("http://localhost:4000/api", this.gameQuery, {
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
