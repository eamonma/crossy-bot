import {
  ButtonInteraction,
  CommandInteraction,
  MessageButton,
  MessageActionRow,
} from "discord.js";
import { Button, Discord, Slash } from "discordx";

@Discord()
class buttonExample {
  @Slash("hello")
  async hello(interaction: CommandInteraction) {
    await interaction.defer();

    const helloBtn = new MessageButton()
      .setLabel("Hello")
      .setEmoji("👋")
      .setStyle("PRIMARY")
      .setCustomId("hello-btn");

    const row = new MessageActionRow().addComponents(helloBtn);

    interaction.editReply({
      content: "Say hello to bot",
      components: [row],
    });
  }

  @Button("hello-btn")
  mybtn(interaction: ButtonInteraction) {
    interaction.reply(`👋 ${interaction.member}`);
  }
}
