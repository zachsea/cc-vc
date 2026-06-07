local dfpwm = require("cc.audio.dfpwm")
local audio = {}

audio.BYTES_PER_FRAME = 120
audio.FRAMES_PER_CHUNK = 8
audio.BYTES_PER_CHUNK = audio.BYTES_PER_FRAME * audio.FRAMES_PER_CHUNK

-- returns a function(userId) -> decoder, creating on first use
function audio.makeDecoderSet()
  local decoders = {}
  return function(userId)
    if not decoders[userId] then
      decoders[userId] = dfpwm.make_decoder()
    end
    return decoders[userId]
  end
end

function audio.appendBuffer(buffers, userId, data)
  buffers[userId] = (buffers[userId] or "") .. data
end

-- extracts one chunk from buffers[userId], decodes and returns audio table or nil
function audio.extractChunk(buffers, userId, getDecoder)
  local raw = buffers[userId] or ""
  if #raw < audio.BYTES_PER_CHUNK then return nil end
  local chunk = raw:sub(1, audio.BYTES_PER_CHUNK)
  buffers[userId] = raw:sub(audio.BYTES_PER_CHUNK + 1)
  return getDecoder(userId)(chunk)
end

-- mix a list of audio tables into one, averaging when multiple
function audio.mix(audioTables)
  if #audioTables == 0 then return nil end
  if #audioTables == 1 then return audioTables[1] end

  local mixed = {}
  local len = #audioTables[1]
  local n = #audioTables
  for i = 1, len do
    local sum = 0
    for j = 1, n do
      sum = sum + audioTables[j][i]
    end
    mixed[i] = sum / n
  end
  return mixed
end

-- extract and mix chunks for a set of userIds, returns mixed audio or nil
function audio.mixUsers(userIds, buffers, getDecoder)
  local audioTables = {}
  for _, userId in ipairs(userIds) do
    local decoded = audio.extractChunk(buffers, userId, getDecoder)
    if decoded then
      table.insert(audioTables, decoded)
    end
  end
  return audio.mix(audioTables)
end

-- play on a speaker peripheral, blocking until it accepts
function audio.play(spk, audioData)
  while not spk.playAudio(audioData) do
    os.pullEvent()
  end
end

-- find all attached speakers, returns list of {name, spk}
function audio.findSpeakers()
  local result = {}
  for _, name in ipairs(peripheral.getNames()) do
    if peripheral.getType(name) == "speaker" then
      table.insert(result, { name = name, spk = peripheral.wrap(name) })
    end
  end
  return result
end

return audio
