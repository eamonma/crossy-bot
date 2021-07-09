import { Message } from "discord.js";
import { Command, Discord } from "discordx";

@Discord()
class simpleCommandExample {
  @Command("hello")
  command(message: Message) {
    message.reply(`👋 ${message.member}`);
  }
}
