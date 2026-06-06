import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/command.js";

type ImportedCommandModule = {
  data?: SlashCommandBuilder;
  execute?: (interaction: ChatInputCommandInteraction) => Promise<void>;
  default?: {
    data?: SlashCommandBuilder;
    execute?: (interaction: ChatInputCommandInteraction) => Promise<void>;
  };
};

type CommandModuleShape = {
  data: { name?: string; toJSON: () => unknown };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

function isCommandModule(mod: unknown): mod is CommandModuleShape {
  if (!mod || typeof mod !== "object") return false;
  const asRecord = mod as Record<string, unknown>;

  const data = asRecord.data;
  if (!data || typeof data !== "object") return false;

  const dataRecord = data as Record<string, unknown>;
  if (typeof dataRecord.name !== "string") return false;
  if (typeof dataRecord.toJSON !== "function") return false;

  if (typeof asRecord.execute !== "function") return false;

  return true;
}

export async function registerCommands(client: Client) {
  const { commands } = await discoverCommands();

  // ensure client.commands exists
  client.commands = client.commands ?? new Collection<string, Command>();

  for (const cmd of commands) {
    client.commands.set(cmd.name, cmd);
  }
}

export async function discoverCommands() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const commandsPath = path.join(__dirname);
  const files = fs.readdirSync(commandsPath);
  const isDist = __dirname.split(path.sep).includes("dist");

  const discovered: Command[] = [];
  const restPayload: unknown[] = [];

  for (const file of files) {
    const full = path.join(commandsPath, file);
    const stat = fs.statSync(full);
    if (!stat.isDirectory()) continue;

    // load from subfolder
    const subfiles = fs.readdirSync(full);
    for (const sf of subfiles) {
      // in dist runtime only import compiled .js files; in src/dev allow .ts too
      if (isDist) {
        if (!sf.endsWith(".js")) continue;
      } else {
        if (!sf.endsWith(".ts") && !sf.endsWith(".js")) continue;
      }

      // skip index and declaration files
      if (sf === "index.ts" || sf === "index.js" || sf.endsWith(".d.ts")) continue;

      const filePath = path.join(commandsPath, file, sf);
      let commandModule: ImportedCommandModule | undefined;
      try {
        console.log(`Importing command module: ${filePath}`);
        const imported: unknown = await import(pathToFileURL(filePath).href);
        commandModule = imported as ImportedCommandModule;
        console.log(
          `Imported keys for ${filePath}:`,
          typeof imported === "object" && imported !== null ? Object.keys(imported as Record<string, unknown>) : []
        );
      } catch (err) {
        console.error(`Failed to import command module at ${filePath}:`, err);
        continue;
      }

      // some toolchains export command objects as the `default` export, normalize the module
      const modAny = commandModule;
      const normalized = modAny && modAny.default && typeof modAny.default === "object" ? modAny.default : modAny;

      if (isCommandModule(normalized)) {
        const cmdModule = normalized as ImportedCommandModule & { data: SlashCommandBuilder };
        const data = cmdModule.data;
        const cmd: Command = {
          name: data.name,
          data,
          execute: cmdModule.execute!,
        };

        discovered.push(cmd);
        restPayload.push(data.toJSON());
      }
    }
  }

  return { commands: discovered, restPayload } as const;
}
