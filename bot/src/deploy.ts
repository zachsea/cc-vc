import { REST, Routes } from "discord.js";
import { env } from "./env.js";
import { discoverCommands } from "./commands/index.js";

const rest = new REST().setToken(env.DISCORD_TOKEN);

try {
  const { restPayload } = await discoverCommands();

  console.log(`Started refreshing ${restPayload.length} application (/) commands.`);

  const data = await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: restPayload });

  console.log(`Successfully reloaded ${(data as unknown[]).length} application (/) commands.`);
} catch (error) {
  console.error(error);
}
