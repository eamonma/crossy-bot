/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GuildMember, Snowflake, CommandInteraction } from "discord.js";
import {
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  DiscordGatewayAdapterCreator,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Track } from "../util/music/track";
import { MusicSubscription } from "../util/music/subscription";
import { Client, Discord, SlashGroup, Slash, SlashOption } from "discordx";
import ytsr from "ytsr";

const subscriptions = new Map<Snowflake, MusicSubscription>();

@Discord()
@SlashGroup("music")
export class music {
  @Slash("play", { description: "Play a song" })
  async play(
    @SlashOption("song", { description: "song name", required: true })
    song: string,

    interaction: CommandInteraction,
    client: Client
  ) {
    const bot = client.botId as "alexa" | "arcee" | "optimus";
    const memebr = interaction.member as GuildMember;
    let subscription = subscriptions.get(interaction.guildId ?? "");
    await interaction.deferReply();

    const filters = await ytsr.getFilters(song);
    const search = filters.get("Type")?.get("Video");

    if (!search) {
      return interaction.followUp(
        `${memebr}, couldn't obtain the search result for video.`
      );
    }

    const result = await ytsr(search.url!, { limit: 1 });
    if (result.items.length < 1 || result.items[0].type !== "video") {
      return interaction.followUp(
        `${memebr}, couldn't obtain the search result for video.`
      );
    }

    // Extract the video URL from the command
    const url = result.items[0].url;

    // If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
    // and create a subscription.
    if (!subscription && memebr.voice.channel) {
      const channel = memebr.voice.channel;
      subscription = new MusicSubscription(
        joinVoiceChannel({
          group: client.botId,
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild
            .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
        }),
        createAudioPlayer()
      );
      subscription.voiceConnection.on("error", console.warn);
      subscriptions.set(interaction.guildId ?? "", subscription);
    }

    // If there is no subscription, tell the user they need to join a channel.
    if (!subscription) {
      await interaction.followUp(
        "Join a voice channel and then try that again!"
      );
      return;
    }

    // Make sure the connection is ready before processing the user's request
    try {
      await entersState(
        subscription.voiceConnection,
        VoiceConnectionStatus.Ready,
        20e3
      );
    } catch (error) {
      console.warn(error);
      await interaction.followUp(
        "Failed to join voice channel within 20 seconds, please try again later!"
      );
      return;
    }

    try {
      // Attempt to create a Track from the user's video URL
      const track = await Track.from(url, {
        onStart() {
          interaction
            .followUp({ content: "Now playing!", ephemeral: true })
            .catch(console.warn);
        },
        onFinish() {
          interaction
            .followUp({ content: "Now finished!", ephemeral: true })
            .catch(console.warn);
        },
        onError(error) {
          console.warn(error);
          interaction
            .followUp({ content: `Error: ${error.message}`, ephemeral: true })
            .catch(console.warn);
        },
      });
      // Enqueue the track and reply a success message to the user
      subscription.enqueue(track);
      await interaction.followUp(`Enqueued **${track.title}**`);
    } catch (error) {
      await interaction.followUp(
        "Failed to play track, please try again later!"
      );
    }
  }

  @Slash("skip", { description: "Skip to the next song in the queue" })
  async skip(interaction: CommandInteraction, client: Client) {
    const bot = client.botId as "alexa" | "arcee" | "optimus";
    const subscription = subscriptions.get(interaction.guildId!);
    subscription?.audioPlayer.stop();
    await interaction.reply("Skipped song!");
  }

  @Slash("queue", { description: "See the music queue" })
  async queue(interaction: CommandInteraction, client: Client) {
    const subscription = subscriptions.get(interaction.guildId!);
    if (subscription) {
      const current =
        subscription.audioPlayer.state.status === AudioPlayerStatus.Idle
          ? `Nothing is currently playing!`
          : `Playing **${
              (subscription.audioPlayer.state.resource as AudioResource<Track>)
                .metadata.title
            }**`;

      const queue = subscription.queue
        .slice(0, 5)
        .map((track, index) => `${index + 1}) ${track.title}`)
        .join("\n");

      await interaction.reply(`${current}\n\n${queue}`);
    } else {
      await interaction.reply("Not playing in this server!");
    }
  }

  @Slash("pause", { description: "Pauses the song that is currently playing" })
  async pause(interaction: CommandInteraction, client: Client) {
    const subscription = subscriptions.get(interaction.guildId!);
    if (subscription) {
      subscription.audioPlayer.pause();
      await interaction.reply({ content: `Paused!`, ephemeral: true });
    } else {
      await interaction.reply("Not playing in this server!");
    }
  }

  @Slash("resume", { description: "Resume playback of the current song" })
  async resume(interaction: CommandInteraction, client: Client) {
    const subscription = subscriptions.get(interaction.guildId!);
    if (subscription) {
      subscription.audioPlayer.unpause();
      await interaction.reply({ content: `Unpaused!`, ephemeral: true });
    } else {
      await interaction.reply("Not playing in this server!");
    }
  }

  @Slash("leave", { description: "Leave the voice channel" })
  async leave(interaction: CommandInteraction, client: Client) {
    const subscription = subscriptions.get(interaction.guildId!);
    if (subscription) {
      subscription.voiceConnection.destroy();
      subscriptions.delete(interaction.guildId!);
      await interaction.reply({ content: `Left channel!`, ephemeral: true });
    } else {
      await interaction.reply("Not playing in this server!");
    }
  }
}
