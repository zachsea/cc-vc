local websocket = require("lib.websocket")
local voice = {}

local WS_URL = "ws://localhost:8080/?token=token"
local HEADER_LEN = 19

function voice.connect(onPacket, onStatus)
  websocket.connect(WS_URL, {}, function(msg, ws)
    -- binary frame: first bytes are userId, rest is DFPWM
    if #msg <= HEADER_LEN then return end

    local userId = msg:sub(1, HEADER_LEN)
    local dfpwmData = msg:sub(HEADER_LEN + 1)

    if onPacket then
      onPacket({ userId = userId, data = dfpwmData })
    end
  end, onStatus)
end

return voice
