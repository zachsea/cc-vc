local websocket        = require("lib.websocket")
local voice            = {}

local WS_URL           = "ws://localhost:8080/?token=token"

local MSG_TYPE_VOICE   = 1 -- 1 << 0
local MSG_TYPE_CONTROL = 2 -- 1 << 2
local USERID_LEN       = 19

local function handleMessage(msg, callbacks)
  local msgType = msg:byte(1)

  if msgType == MSG_TYPE_VOICE then
    local userId = msg:sub(2, 1 + USERID_LEN)
    local data   = msg:sub(2 + USERID_LEN)
    if callbacks.onPacket then
      callbacks.onPacket({ userId = userId, data = data })
    end
  elseif msgType == MSG_TYPE_CONTROL then
    local ok, decoded = pcall(textutils.unserializeJSON, msg:sub(2))
    if not ok or not decoded then return end

    local t = decoded.type
    if t == "userList" and callbacks.onUserList then
      callbacks.onUserList(decoded.users)
    elseif t == "userJoin" and callbacks.onUserJoin then
      callbacks.onUserJoin(decoded.user)
    elseif t == "userLeave" and callbacks.onUserLeave then
      callbacks.onUserLeave(decoded.userId)
    elseif t == "channelLeave" and callbacks.onChannelLeave then
      callbacks.onChannelLeave()
    end
  end
end

--[[
  voice.connect(callbacks)

  callbacks = {
    onPacket(packet)         -- { userId: string, data: string }
    onUserList(users)        -- array of { userId, displayName }
    onUserJoin(user)         -- { userId, displayName }
    onUserLeave(userId)      -- string
    onChannelLeave()
    onStatus(status)         -- string
  }
--]]
function voice.connect(callbacks)
  websocket.connect(WS_URL, {}, function(msg, ws)
    handleMessage(msg, callbacks)
  end, function(status)
    if callbacks.onStatus then callbacks.onStatus(status) end
  end)
end

return voice
