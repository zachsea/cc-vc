import { Collection, Events, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "../types/command.js";

export const name: Events = Events.InteractionCreate;
export const once = false;
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  const commands = interaction.client.commands as Collection<string, Command>;
  const command = commands?.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`);
    if (error instanceof Error) console.error(error.stack ?? error.message);
    else console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
