local voice = require("lib.voice")
local dfpwm = require("cc.audio.dfpwm")

local speaker = peripheral.find("speaker")
if not speaker then error("No speaker found!") end

local BYTES_PER_FRAME = 120
local FRAMES_PER_CHUNK = 8
local BYTES_PER_CHUNK = BYTES_PER_FRAME * FRAMES_PER_CHUNK

local rawBuffers = {}
local decoders = {}

local function getDecoder(userId)
  if not decoders[userId] then
    decoders[userId] = dfpwm.make_decoder()
  end
  return decoders[userId]
end

local function receiver()
  voice.connect(function(packet)
    local userId = packet.userId
    rawBuffers[userId] = (rawBuffers[userId] or "") .. packet.data
    os.queueEvent("audio_chunk_ready", userId)
  end, function(status)
    print("Status: " .. status)
  end)
end

local function player()
  while true do
    local _, userId = os.pullEvent("audio_chunk_ready")

    while #(rawBuffers[userId] or "") >= BYTES_PER_CHUNK do
      local raw = rawBuffers[userId]
      local chunk = raw:sub(1, BYTES_PER_CHUNK)
      rawBuffers[userId] = raw:sub(BYTES_PER_CHUNK + 1)

      local audio = getDecoder(userId)(chunk)
      while not speaker.playAudio(audio) do
        os.pullEvent()
      end
    end
  end
end

parallel.waitForAll(receiver, player)
