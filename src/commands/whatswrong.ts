import { CommandInteraction, MessageAttachment } from "discord.js"
import { Discord, Slash } from "discordx"
import { gql } from "graphql-request"
import { graphQLClient } from "../graphqlClient.js"

enum TextChoices {
  Hello = "Hello",
  "Good Bye" = "GoodBye",
}

@Discord()
// @SlashGroup("fill", "Fill letters in crossword", {
//   maths: "maths group description",
//   text: "text group description",
// })
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

  @Slash("whatswrong")
  async whatswrong(
    // @SlashOption("private", {
    //   type: "BOOLEAN",
    //   description: "Only show to you",
    //   required: false,
    // })
    // ephemeral: boolean = true,
    interaction: CommandInteraction
  ) {
    let response

    await interaction.deferReply()

    try {
      const allFilled = await graphQLClient.request(this.checkAllFilled, {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
      })

      if (!allFilled.allFilled) {
        return await interaction.editReply("Die, pig.")
      }
    } catch (error) {
      console.log(error)

      return interaction.followUp(
        "Something went wrong with checking filled-ness. Try again later."
      )
    }

    try {
      response = await graphQLClient.request(this.checkWhichIncorrect, {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
      })
    } catch (error) {
      console.log(error)

      return interaction.editReply(
        "Start a game before you check what's incorrect."
      )
    }

    if (!response) {
      return interaction.editReply(
        "Failed to check game. Please try again later"
      )
    }

    // const crosswordData = JSON.parse(response.whichIncorrect.puzzle)

    const bufferAttachmenet = Buffer.from(
      `${response.whichIncorrect.image}`,
      "base64"
    )
    const attachment = new MessageAttachment(bufferAttachmenet, "output.png")

    await interaction.editReply({
      files: [attachment],
    })
  }
}
