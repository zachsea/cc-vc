import { Client, Events } from "discord.js";
import { onBotJoinChannel } from "./voice-state-update.js";

export const name: Events = Events.ClientReady;
export const once = true;
export async function execute(client: Client) {
  console.log(`Ready! Logged in as ${client.user?.tag}`);
  for (const guild of client.guilds.cache.values()) {
    const botMember = guild.members.me;
    if (botMember?.voice?.channel) {
      onBotJoinChannel(botMember.voice.channel);
      // assumes bot is only in one channel at a time
      break;
    }
  }
}
