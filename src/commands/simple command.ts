import { Message } from "discord.js";
import { SimpleCommand, SimpleCommandOption, Discord } from "discordx";

@Discord()
class simpleCommandExample {
  @SimpleCommand("hello", { aliases: ["hi"] })
  hello(message: Message) {
    message.reply(`👋 ${message.member}`);
  }

  @SimpleCommand("sum", { argSplitter: "+" })
  sum(
    @SimpleCommandOption("num1") num1: number,
    @SimpleCommandOption("num2") num2: number,
    message: Message
  ) {
    if (typeof num1 !== "number" || typeof num2 !== "number") {
      return message.reply(`**Usage**: 1+1`);
    }
    message.reply(`total = ${num1 + num2}`);
  }
}
