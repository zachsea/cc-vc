import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export interface Command {
  name: string; // redundant, makes it easier to access (dupe of data.name)
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
