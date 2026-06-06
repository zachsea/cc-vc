import {
  ChatInputCommandInteraction,
  ChannelType,
  SlashCommandBuilder,
  VoiceBasedChannel,
  InteractionContextType,
} from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import { attachVoiceReceiver } from "../../voice/receiver.js";

export const data = new SlashCommandBuilder()
  .setName("connect")
  .setDescription("Adds bot to a voice channel. Defaults to your current voice channel.")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Voice channel to join")
      .addChannelTypes(ChannelType.GuildVoice)
      .setRequired(false)
  )
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: "This command only works in a server", ephemeral: true });
    return;
  }

  const selectedChannel = interaction.options.getChannel("channel");
  let voiceChannel: VoiceBasedChannel | null = null;

  if (selectedChannel) {
    if (selectedChannel.type !== ChannelType.GuildVoice && selectedChannel.type !== ChannelType.GuildStageVoice) {
      await interaction.reply({ content: "Please provide a voice channel", ephemeral: true });
      return;
    }
    voiceChannel = selectedChannel as VoiceBasedChannel;
  } else {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    voiceChannel = member.voice.channel;
  }

  if (!voiceChannel) {
    await interaction.reply({
      content: "You are not connected to a voice channel and no channel was provided",
      ephemeral: true,
    });
    return;
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
  });

  attachVoiceReceiver(connection, interaction.guild.id);
  await interaction.reply({ content: `Joined **${voiceChannel.name}**`, ephemeral: false });
}
