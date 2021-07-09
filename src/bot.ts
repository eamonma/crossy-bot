import "reflect-metadata";
import path from "path";
import { Intents, Interaction, Message } from "discord.js";
import { Client } from "discordx";

const bot = new Client({
  prefix: "#",
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  classes: [path.join(__dirname, "commands", "**/*.{ts,js}")],
  silent: true,
});

bot.on("ready", () => {
  bot.initSlashes({ log: { forGuild: true, forGlobal: true } });
});

bot.on("interactionCreate", (interaction: Interaction) => {
  bot.executeInteraction(interaction);
});

bot.on("messageCreate", (message: Message) => {
  bot.executeCommand(message);
});

bot.login(""); // provide your button token
