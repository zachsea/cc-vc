import { Collection } from "discord.js";
import { Command } from "./types/command";

// extend the Client interface to include commands
declare module "discord.js" {
  export interface Client {
    commands?: Collection<string, Command>;
  }
}
