local websocket = require("lib.websocket")
local voice = {}

local WS_URL = "ws://localhost:8080/?token=token"

function voice.connect(onPacket, onStatus)
  websocket.connect(WS_URL, {}, function(msg, ws)
    local ok, data = pcall(textutils.unserializeJSON, msg)
    if not ok or not data then return end

    if data.type == "connected" then
      if onStatus then onStatus("ready") end
    elseif data.type == "voicePacket" then
      if onPacket then onPacket(data) end
    end
  end, onStatus)
end

return voice
