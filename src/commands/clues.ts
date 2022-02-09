import { Pagination } from "@discordx/pagination"
import axios from "axios"
import { CommandInteraction, MessageEmbed } from "discord.js"
import { Discord, Slash, SlashOption, SlashGroup, SlashChoice } from "discordx"
import { request, gql } from "graphql-request"
import { decode } from "html-entities"
import escape from "markdown-escape"
// import { crosswordData } from "../today"
// import crosswordData from "../today.json"

enum TextChoices {
  Hello = "Hello",
  "Good Bye" = "GoodBye",
}

@Discord()
export abstract class AppDiscord {
  gameQuery: string = gql`
    query game($channelId: String!, $guildId: String!) {
      game(channelId: $channelId, guildId: $guildId) {
        puzzle
      }
    }
  `

  @Slash("qc")
  async quickClue(
    @SlashOption("grid", {
      type: "STRING",
      description: "Clue number and direction (1d)",
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
          console.log(grid)

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
    @SlashChoice("Both", "both")
    @SlashOption("direction", {
      type: "STRING",
      description: "Across or down or both",
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
    const response = await request(
      "http://localhost:4000/api",
      this.gameQuery,
      {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
      }
    )

    const crosswordData = JSON.parse(response.game.puzzle)

    console.log(crosswordData.clues)

    if (gridNum) {
      const isBoth = direction === "both"
      let replyValue, clue

      try {
        if (isBoth) direction = "across"

        clue = crosswordData.clues[direction].find((clue: string) =>
          clue.substring(0, clue.indexOf(".")).includes(JSON.stringify(gridNum))
        )

        replyValue = `${"```"} ${gridNum} ${direction}: ${decode(
          clue
        ).substring(clue.indexOf(". ") + 2)}`
      } catch {
        replyValue = `${"```"}`
      }

      if (isBoth) {
        try {
          direction = "down"
          clue = crosswordData.clues[direction].find((clue: string) =>
            clue
              .substring(0, clue.indexOf("."))
              .includes(JSON.stringify(gridNum))
          )

          replyValue += `\n ${gridNum} ${direction}: ${decode(clue).substring(
            clue.indexOf(". ") + 2
          )}`
        } catch {}
      }

      replyValue += `${"```"}`

      if (!clue) clue = "0. No clue."

      return interaction.reply(replyValue)
    }

    const pages: MessageEmbed[] = []

    let clues = crosswordData.clues[direction]

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
          const clueText = escape(decode(clue))
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
    await pagination.send()
  }
}
