import { Pagination } from "@discordx/pagination"
import { CommandInteraction, MessageEmbed } from "discord.js"
import { Discord, Slash, SlashChoice, SlashOption } from "discordx"
import { gql } from "graphql-request"
import { decode } from "html-entities"
import escape from "markdown-escape"
import { Clues, CrosswordData } from "../types/crossword"

import { graphQLClient } from "../graphqlClient.js"

@Discord()
export abstract class CrosswordClues {
  gameQuery: string = gql`
    query game($channelId: String!, $guildId: String!) {
      game(channelId: $channelId, guildId: $guildId) {
        puzzle
      }
    }
  `

  static extractClue(
    clues: Clues,
    gridNum: number,
    direction: "across" | "down"
  ): [string, string | undefined] {
    for (const clue of clues[direction]) {
      const indexOfFirstSpace = clue.indexOf(" ")
      const prefix = clue.substring(0, indexOfFirstSpace)
      const clueText = clue.substring(indexOfFirstSpace + 1)
      try {
        const num = parseInt(prefix.substring(0, prefix.indexOf(".")))

        if (gridNum === num) return [`${gridNum} ${direction}`, clueText]
      } catch {
        // return [prefix, "No such clue."]
      }
    }

    return [`${gridNum} ${direction}`, undefined]
  }

  static findClues(
    clues: Clues,
    gridNum: number,
    direction: "across" | "down" | "both"
  ): Array<[string, string | undefined]> {
    let clueDir: "across" | "down" = direction === "both" ? "across" : direction

    const cluesArray: Array<[string, string | undefined]> = []

    cluesArray.push(this.extractClue(clues, gridNum, clueDir))

    if (direction === "both") {
      clueDir = "down"
      cluesArray.push(this.extractClue(clues, gridNum, clueDir))
    }

    return cluesArray
  }

  @Slash("qc")
  async quickClue(
    @SlashOption("grid", {
      type: "STRING",
      description: "Clue number, maybe with direction (e.g. 1d or 1)",
    })
    grid: string,
    interaction: CommandInteraction
  ) {
    let direction: "across" | "down" | "both" = "both"
    let gridNum: number = 0

    try {
      if (grid.includes("d")) {
        direction = "down"
        gridNum = parseInt(grid.substring(0, grid.indexOf("d")))
      } else if (grid.includes("a")) {
        direction = "across"
        gridNum = parseInt(grid.substring(0, grid.indexOf("a")))
      } else {
        try {
          gridNum = parseInt(grid)
          direction = "both"

          if (!gridNum) return interaction.reply("Not a valid grid number.")
        } catch {
          return interaction.reply("Not a valid grid number.")
        }
      }
    } catch {
      return interaction.reply("Not a valid grid number.")
    }

    this.clue(gridNum, direction, interaction)
  }

  @Slash("clue")
  async clue(
    @SlashOption("number", {
      type: "INTEGER",
      description: "grid number",
    })
    gridNum: number,
    @SlashChoice("Across", "across")
    @SlashChoice("Down", "down")
    @SlashChoice("Both", "both")
    @SlashOption("direction", {
      type: "STRING",
      description: "Across or down or both",
    })
    direction: "across" | "down" | "both",
    interaction: CommandInteraction
  ) {
    this.clues(direction, gridNum, interaction)
  }

  @Slash("clues")
  //   @SlashGroup("maths")
  async clues(
    // @SlashOption("num", { type: "INTEGER", description: "Clue number" })
    // num: number,
    @SlashChoice("Across", "across")
    @SlashChoice("Down", "down")
    @SlashOption("direction", {
      type: "STRING",
      description: "Across or down",
    })
    direction: "across" | "down" | "both",
    @SlashOption("number", {
      type: "INTEGER",
      description: "number (optional)",
      required: false,
    })
    gridNum: number,
    interaction: CommandInteraction
  ) {
    let response
    try {
      response = await graphQLClient.request(this.gameQuery, {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
      })
    } catch (error: any) {
      return await interaction.reply("No such game.")
    }

    const crosswordData: CrosswordData = JSON.parse(response.game.puzzle)

    if (gridNum) {
      const isBoth = direction === "both"
      let replyValue, clue

      replyValue = `${"```"}`

      const listOfClues = CrosswordClues.findClues(
        crosswordData.clues,
        gridNum,
        direction
      )

      for (const clue of listOfClues) {
        if (clue[1])
          replyValue += `\n ${clue[0]}: ${decode(
            clue[1].replaceAll("<em>", "*").replaceAll("</em>", "*")
          )}`
      }

      if (listOfClues.every((clue) => !clue[1]))
        replyValue += `\n No such clue.`

      replyValue += `${"```"}`

      if (!clue) clue = "0. No clue."

      return await interaction.reply(replyValue)
    }

    const pages: MessageEmbed[] = []

    let clues = crosswordData.clues[direction as "across" | "down"]

    if (!clues) clues = []

    const CLUES_PER_PAGE = 20

    for (let i = 0; i < clues.length; i += CLUES_PER_PAGE + 1) {
      let clue = clues[i]
      let embed = new MessageEmbed()

      embed.setTitle(
        direction.substring(0, 1).toUpperCase() +
          direction.substring(1) +
          " clues"
      )

      let description = ""

      for (let j = 0; j <= CLUES_PER_PAGE; j++) {
        try {
          clue = clues[i + j]
          if (!clue) break
          const clueText = escape(
            decode(clue).replaceAll("<em>", "*").replaceAll("</em>", "*"),
            ["asterisks"]
          )
          const num = clueText.substring(0, clueText.indexOf(" "))
          description += `\`${num.padStart(4, " ")}\` ${clueText.substring(
            clueText.indexOf(" ")
          )}\n`
        } catch {}
      }

      embed.setDescription(description)

      pages.push(embed)
    }

    // const pages = crosswordData.clues.across.map((clue) => {
    //   return (
    //     new MessageEmbed()
    // .setFooter({ text: `Page ${i + 1} of ${commands.length}` })
    // .setTitle("**Slash command info**")
    // .addField("Name", cmd.name)
    //   .addField("Description", cmd.description)
    //       .setTitle("Across clues")
    //       .addField(
    //         clue.substring(0, clue.indexOf(" ") - 1) + " across",
    //         decode(clue)
    //       )
    //   )
    // })
    const pagination = new Pagination(interaction, pages)
    try {
      // await interaction.reply({embeds: [pagination]})
      await pagination.send()
    } catch {
      interaction.reply("Clues failed. Try again.")
    }
  }
}
