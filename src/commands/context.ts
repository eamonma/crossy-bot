import { Interaction } from "discord.js";
import { Discord, ContextMenu } from "discordx";

@Discord()
export abstract class contextTest {
  @ContextMenu("MESSAGE", "message context")
  async messageHandler(interaction: Interaction) {
    if (interaction.isContextMenu()) {
      interaction.reply("I am user context handler");
    }
  }

  @ContextMenu("USER", "user context")
  async userHandler(interaction: Interaction) {
    if (interaction.isContextMenu()) {
      interaction.reply("I am user context handler");
    }
  }
}
