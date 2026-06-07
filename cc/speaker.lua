local voice = require("lib.voice")
local audio = require("lib.audio")

local spk = peripheral.find("speaker")
if not spk then error("No speaker found!") end

local rawBuffers = {}
local getDecoder = audio.makeDecoderSet()

local function getMixed()
  local audioTables = {}
  for userId in pairs(rawBuffers) do
    local decoded = audio.extractChunk(rawBuffers, userId, getDecoder)
    if decoded then table.insert(audioTables, decoded) end
  end
  return audio.mix(audioTables)
end

local function receiver()
  voice.connect({
    onPacket = function(packet)
      audio.appendBuffer(rawBuffers, packet.userId, packet.data)
      os.queueEvent("audio_chunk_ready")
    end,
    onUserList = function(users)
      print("Users in channel: " .. #users)
      for _, u in ipairs(users) do
        print("  " .. u.displayName)
      end
    end,
    onUserJoin = function(user)
      print(user.displayName .. " joined")
    end,
    onUserLeave = function(userId)
      -- clear their audio buffer
      rawBuffers[userId] = nil
      print(userId .. " left")
    end,
    onChannelLeave = function()
      rawBuffers = {}
      print("Bot left channel, clearing buffers")
    end,
    onStatus = function(status)
      print("Status: " .. status)
    end,
  })
end

local function player()
  while true do
    local event = os.pullEvent()
    if event == "audio_chunk_ready" or event == "speaker_audio_empty" then
      local mixed = getMixed()
      if mixed then audio.play(spk, mixed) end
    end
  end
end

parallel.waitForAll(receiver, player)
