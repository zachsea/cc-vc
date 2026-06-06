import { Client, GatewayIntentBits } from "discord.js";
import { env } from "./env.js";
import { registerCommands } from "./commands/index.js";
import { registerEvents } from "./events/index.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });

await registerEvents(client);
await registerCommands(client);
await client.login(env.DISCORD_TOKEN);
