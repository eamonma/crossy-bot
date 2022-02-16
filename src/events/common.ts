import type { ArgsOf } from "discordx"
import { Discord, On, Client } from "discordx"

@Discord()
export abstract class AppDiscord {
  randomIntFromInterval(min: number, max: number) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  @On("messageDelete")
  onMessage([message]: ArgsOf<"messageDelete">, client: Client) {
    console.log("Message Deleted", client.user?.username, message.content)
  }

  @On("messageCreate")
  async dmHandler([message]: ArgsOf<"messageDelete">, client: Client) {
    if (message.author?.bot) return

    const messageToSend = `Message from ${message.author?.username}#${message.author?.discriminator} (${message.author?.id})`

    console.log(
      `=====${messageToSend}=====\n${message.content}\n=====${"".padEnd(
        messageToSend.length,
        "="
      )}=====`
    )
    if (message.channel.type === "DM") {
      if (message.content?.includes("bruh")) return
      await message.channel.sendTyping()

      let response = "bruh"

      if (message.content?.includes("fuck")) response = "why so rude"
      if (message.content?.includes("shit")) response = "damn"
      if (message.content?.includes("slow")) response = "no u"

      setTimeout(async () => {
        await message.author?.send(response)
      }, this.randomIntFromInterval(2, 5) * 1000)
    }
  }
}
