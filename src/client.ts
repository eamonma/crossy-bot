import "reflect-metadata";
import path from "path";
import { Intents, Interaction, Message } from "discord.js";
import { Client } from "discordx";

const client = new Client({
  prefix: "!",
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
  classes: [
    path.join(__dirname, "commands", "**/*.{ts,js}"),
    path.join(__dirname, "events", "**/*.{ts,js}"),
  ],
  slashGuilds: ["874802018361950248"],
  silent: true,
});

client.on("ready", () => {
  client.initApplicationCommands({ log: { forGuild: true, forGlobal: true } });
});

client.on("interactionCreate", (interaction: Interaction) => {
  client.executeInteraction(interaction);
});

client.on("messageCreate", (message: Message) => {
  client.executeCommand(message);
});

client.login(process.env.BOT_TOKEN ?? ""); // provide your bot token
