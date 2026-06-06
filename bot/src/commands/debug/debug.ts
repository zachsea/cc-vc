// reminder parent, sub command to set a one-time reminder about the daily, sub command to view that reminder
import { ChatInputCommandInteraction, InteractionContextType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("debug")
  .setDescription("for dev")
  .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({ embeds: [{ title: "alive", color: 0x00ff00 }] });
}
