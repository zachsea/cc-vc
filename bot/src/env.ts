import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_TOKEN: z.string().min(1),
  },
  emptyStringAsUndefined: true,
  runtimeEnvStrict: {
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  },
});
