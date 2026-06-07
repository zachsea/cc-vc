local voice = require("lib.voice")
local audio = require("lib.audio")

local speaker = {}

function speaker.create(callbacks)
  local rawBuffers = {}
  local getDecoder = audio.makeDecoderSet()
  local currentUsers = {}
  local activeUsers = {}
  local activeTimers = {}
  local timerUser = {}

  local function emitActiveUsers()
    if callbacks.onActiveUsers then
      local ids = {}
      for id in pairs(activeUsers) do table.insert(ids, id) end
      callbacks.onActiveUsers(ids)
    end
  end

  local function clearActive(userId)
    if activeUsers[userId] then
      activeUsers[userId] = nil
      emitActiveUsers()
    end
    if activeTimers[userId] then
      os.cancelTimer(activeTimers[userId])
      timerUser[activeTimers[userId]] = nil
      activeTimers[userId] = nil
    end
  end

  local function clearAllActive()
    local ids = {}
    for userId in pairs(activeUsers) do table.insert(ids, userId) end
    for _, userId in ipairs(ids) do
      clearActive(userId)
    end
  end

  local function setActive(userId)
    if not activeUsers[userId] then
      activeUsers[userId] = true
      emitActiveUsers()
    end
    if activeTimers[userId] then
      os.cancelTimer(activeTimers[userId])
      timerUser[activeTimers[userId]] = nil
    end
    local timerId = os.startTimer(1)
    activeTimers[userId] = timerId
    timerUser[timerId] = userId
  end

  local function getUserIdsWithBuffer()
    local ids = {}
    for userId, buffer in pairs(rawBuffers) do
      if #buffer > 0 then table.insert(ids, userId) end
    end
    return ids
  end

  local function getMixed()
    local mixed = audio.mixUsers(getUserIdsWithBuffer(), rawBuffers, getDecoder)
    emitActiveUsers()
    return mixed
  end

  local function handleUserList(users)
    currentUsers = {}
    for _, user in ipairs(users) do
      currentUsers[user.userId] = user.displayName
    end
    if callbacks.onUserList then callbacks.onUserList(users) end
  end

  local function handleUserJoin(user)
    currentUsers[user.userId] = user.displayName
    if callbacks.onUserJoin then callbacks.onUserJoin(user) end
  end

  local function handleUserLeave(userId)
    rawBuffers[userId] = nil
    currentUsers[userId] = nil
    clearActive(userId)
    if callbacks.onUserLeave then callbacks.onUserLeave(userId) end
  end

  local function handleChannelLeave()
    rawBuffers = {}
    currentUsers = {}
    clearAllActive()
    if callbacks.onChannelLeave then callbacks.onChannelLeave() end
  end

  local function handlePacket(packet)
    audio.appendBuffer(rawBuffers, packet.userId, packet.data)
    setActive(packet.userId)
    os.queueEvent("audio_chunk_ready")
  end

  local function receiver()
    voice.connect({
      onPacket = handlePacket,
      onUserList = handleUserList,
      onUserJoin = handleUserJoin,
      onUserLeave = handleUserLeave,
      onChannelLeave = handleChannelLeave,
      onStatus = callbacks.onStatus,
    })
  end

  local function player()
    local speakers = audio.findSpeakers()
    local spk = speakers[1] and speakers[1].spk
    if not spk then error("No speaker peripheral found!") end

    while true do
      local event, arg = os.pullEvent()
      if event == "audio_chunk_ready" or event == "speaker_audio_empty" then
        local mixed = getMixed()
        if mixed then audio.play(spk, mixed) end
      elseif event == "timer" then
        local userId = timerUser[arg]
        if userId and activeTimers[userId] == arg then
          activeTimers[userId] = nil
          timerUser[arg] = nil
          clearActive(userId)
        end
      end
    end
  end

  return {
    receiver = receiver,
    player = player,
  }
end

return speaker
