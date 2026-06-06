import path from "node:path";
import fs from "node:fs";
import { Client } from "discord.js";
import { fileURLToPath, pathToFileURL } from "node:url";

type EventModuleShape = {
  name: string;
  once: boolean;
  execute: (...args: unknown[]) => Promise<void> | void;
};

function isEventModule(mod: unknown): mod is EventModuleShape {
  if (!mod || typeof mod !== "object") return false;
  const asRecord = mod as Record<string, unknown>;

  if (typeof asRecord.name !== "string") return false;
  if (typeof asRecord.once !== "boolean") return false;
  if (typeof asRecord.execute !== "function") return false;

  return true;
}

export async function registerEvents(client: Client) {
  const eventsPath = path.join(path.dirname(fileURLToPath(import.meta.url)));
  const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of eventFiles) {
    if (file === "index.ts" || file === "index.js") continue;
    const filePath = path.join(eventsPath, file);
    const event: unknown = await import(pathToFileURL(filePath).href);
    if (isEventModule(event)) {
      if (event.once) {
        client.once(event.name, (...args: unknown[]) => event.execute(...args));
      } else {
        client.on(event.name, (...args: unknown[]) => event.execute(...args));
      }
    }
  }
}
