import { Message } from "discord.js";
import { Command, CommandOption, Discord } from "discordx";

@Discord()
class simpleCommandExample {
  @Command("hello", { aliases: ["hi"] })
  hello(message: Message) {
    message.reply(`👋 ${message.member}`);
  }

  @Command("sum", { argSplitter: "+" })
  sum(
    @CommandOption() num1: number,
    @CommandOption() num2: number,
    message: Message
  ) {
    if (typeof num1 !== "number" || typeof num2 !== "number") {
      return message.reply(`**Usage**: 1+1`);
    }
    message.reply(`total = ${num1 + num2}`);
  }
}
