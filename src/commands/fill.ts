import axios from "axios"
import {
  CommandInteraction,
  GuildMember,
  Message,
  MessageAttachment,
} from "discord.js"
import { Discord, Slash, SlashOption, SlashGroup, SlashChoice } from "discordx"
import { gql } from "graphql-request"
import { decode } from "html-entities"
import { CrosswordData } from "../types/crossword"
import { CrosswordClues } from "./clues.js"

import { graphQLClient } from "../graphqlClient.js"

enum TextChoices {
  Hello = "Hello",
  "Good Bye" = "GoodBye",
}

@Discord()
export abstract class AppDiscord {
  fillMutation: string = gql`
    mutation fill(
      $channelId: String!
      $guildId: String!
      $answer: String!
      $direction: String!
      $playerId: String!
      $gridNum: Float!
    ) {
      fill(
        channelId: $channelId
        guildId: $guildId
        answer: $answer
        direction: $direction
        playerId: $playerId
        gridNum: $gridNum
      ) {
        image
        puzzle
        active
      }
    }
  `

  checkCorrect: string = gql`
    mutation checkCorrect($channelId: String!, $guildId: String!) {
      checkCorrect(channelId: $channelId, guildId: $guildId) {
        allCorrect
        mismatched
      }
    }
  `

  checkAllFilled: string = gql`
    query allFilled($channelId: String!, $guildId: String!) {
      allFilled(channelId: $channelId, guildId: $guildId)
    }
  `

  checkWhichIncorrect: string = gql`
    mutation whichIncorrect($channelId: String!, $guildId: String!) {
      whichIncorrect(channelId: $channelId, guildId: $guildId) {
        image
      }
    }
  `

  @Slash("qf")
  async quickFill(
    @SlashOption("grid", {
      type: "STRING",
      description: "Clue number and direction (1d)",
    })
    grid: string,
    @SlashOption("answer", { type: "STRING", description: "Answer" })
    answer: string,
    interaction: CommandInteraction
  ) {
    let direction: "across" | "down" = "across"
    let gridNum: number = 0

    try {
      if (grid.includes("d")) {
        direction = "down"
        gridNum = parseInt(grid.substring(0, grid.indexOf("d")))
      } else if (grid.includes("a")) {
        direction = "across"
        gridNum = parseInt(grid.substring(0, grid.indexOf("a")))
      } else {
        return interaction.reply("Not a valid grid number.")
      }
    } catch {
      return interaction.reply("Not a valid grid number.")
    }

    this.fill(gridNum, direction, answer, interaction)
  }

  @Slash("fill")
  async fill(
    @SlashOption("num", { type: "INTEGER", description: "Clue number" })
    gridNum: number,
    @SlashChoice("Across", "across")
    @SlashChoice("Down", "down")
    @SlashOption("direction", { type: "STRING", description: "Across or down" })
    direction: "across" | "down",
    @SlashOption("answer", { type: "STRING", description: "Answer" })
    answer: string,
    interaction: CommandInteraction
  ) {
    let response

    await interaction.deferReply()

    try {
      response = await graphQLClient.request(this.fillMutation, {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        answer,
        direction,
        gridNum,
        playerId: interaction.user.id,
      })
    } catch (error) {
      console.log(error)

      return interaction.editReply("Start a game before you start playing.")
    }

    if (!response) {
      return interaction.editReply(
        "Failed to start game. Please try again later"
      )
    }

    const crosswordData: CrosswordData = JSON.parse(response.fill.puzzle)

    const bufferAttachmenet = Buffer.from(`${response.fill.image}`, "base64")
    const attachment = new MessageAttachment(bufferAttachmenet, "output.png")

    let nickname

    if (interaction.member) {
      nickname = (interaction.member as GuildMember).displayName
    } else {
      nickname = interaction.user.username
    }

    let clue = crosswordData.clues[direction].find((clue: string) =>
      clue.substring(0, clue.indexOf(".")).includes(JSON.stringify(gridNum))
    )

    if (!clue) clue = "0. No clue."

    const [prefix, clueText] = CrosswordClues.extractClue(
      crosswordData.clues,
      gridNum,
      direction
    )

    await interaction.editReply({
      content: `${"```"} ${nickname} filled in ${answer.toUpperCase()} for 
 ${prefix}: ${decode(clueText)} ${"```"}`,
      files: [attachment],
    })

    // Check if game is completely filled

    try {
      const allFilled = await graphQLClient.request(this.checkAllFilled, {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
      })

      if (allFilled.allFilled) {
        const checkCorrect = await graphQLClient.request(this.checkCorrect, {
          channelId: interaction.channelId,
          guildId: interaction.guildId,
        })

        if (checkCorrect.checkCorrect.allCorrect)
          return interaction.followUp("holy shit thats so hot i'll suck your bussy")
        return interaction.followUp(
          "You failed to solve the puzzle. Be more creative."
        )
      }
    } catch (error) {
      console.log(error)

      return interaction.followUp(
        "Something went wrong with checking correctness. Try again later."
      )
    }
  }
}
