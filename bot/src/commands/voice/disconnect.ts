import { ChatInputCommandInteraction, InteractionContextType, SlashCommandBuilder } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

export const data = new SlashCommandBuilder()
  .setName("disconnect")
  .setDescription("Disconnect the bot from the current voice channel.")
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: "This command only works in a server", ephemeral: true });
    return;
  }

  const connection = getVoiceConnection(interaction.guild.id);
  if (!connection) {
    await interaction.reply({ content: "Not connected to voice in this server", ephemeral: true });
    return;
  }

  connection.destroy();
  await interaction.reply({ content: "Disconnected from voice", ephemeral: false });
}
