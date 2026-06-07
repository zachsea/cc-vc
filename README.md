# cc-vc

Stream Discord VC audio to speaker peripherals in ComputerCraft.

## Setup

### 1. Create Discord bot account

Create a bot, invite to your target server with necessary voice permissions

### 2. Run the bot/websocket server

Deploy the bot how you want (very basic docker image/compose included) with env vars:

    - `DISCORD_CLIENT_ID`
    - `DISCORD_TOKEN`
    - `WS_PORT`
    - `WS_TOKEN` - minimal auth for the ws server

### 3. Change the WS_URL in `cc/lib/voice.lua`

Have this point to your bot's WebSocket server (e.g. `ws://localhost:8080/?token=...`). You could also do this after copying to the CC filesystem, of course.

### 4. Add the scripts under `cc/`

Put these at the root of your CC filesystem in the same strucutre (e.g. /speaker.lua, /lib/voice.lua, etc)

### 5. Run `startup.lua` to connect to the bot and start receiving audio

Use `/connect` to add the bot to a voice channel and `/disconnect` to remove it.

A speaker must be attached, a monitor can be optionally attached to show who's currently speaking.
