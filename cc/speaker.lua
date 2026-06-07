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

-- decode a chunk from every user that has enough data, mix into one buffer
local function tryMixAndPlay()
  local audioTables = {}

  for userId, raw in pairs(rawBuffers) do
    if #raw >= BYTES_PER_CHUNK then
      local chunk = raw:sub(1, BYTES_PER_CHUNK)
      rawBuffers[userId] = raw:sub(BYTES_PER_CHUNK + 1)
      table.insert(audioTables, getDecoder(userId)(chunk))
    end
  end

  if #audioTables == 0 then return false end

  local mixed = {}
  local len = #audioTables[1]
  local n = #audioTables

  if n == 1 then
    mixed = audioTables[1]
  else
    for i = 1, len do
      local sum = 0
      for j = 1, n do
        sum = sum + audioTables[j][i]
      end
      mixed[i] = sum / n
    end
  end

  while not speaker.playAudio(mixed) do
    os.pullEvent()
  end

  return true
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
  local active = false

  while true do
    local event = os.pullEvent()

    if event == "audio_chunk_ready" or (event == "speaker_audio_empty" and active) then
      if tryMixAndPlay() then
        active = true
      else
        active = false
      end
    end
  end
end

parallel.waitForAll(receiver, player)
