local voice = require("lib.voice")
local dfpwm = require("cc.audio.dfpwm")
-- requires new version (1.119.0+)
local base64 = require "cc.base64"

local speaker = peripheral.find("speaker")
if not speaker then error("No speaker found!") end

local decoders = {}

local function getDecoder(userId)
  if not decoders[userId] then
    decoders[userId] = dfpwm.make_decoder()
  end
  return decoders[userId]
end

local function onPacket(packet)
  local decoder = getDecoder(packet.userId)
  local raw = base64.decode(packet.data)
  local audio = decoder(raw)

  while not speaker.playAudio(audio) do
    os.pullEvent("speaker_audio_empty")
  end
end

local function onStatus(status)
  print("Status: " .. status)
end

print("Connecting to voice...")
voice.connect(onPacket, onStatus)
