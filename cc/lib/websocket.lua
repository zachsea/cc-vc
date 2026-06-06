local websocket = {}

function websocket.connect(url, headers, onMessage, onStatus)
  if onStatus then onStatus("connecting") end
  http.websocketAsync(url, headers or {})

  local ws = nil
  local ok, err = pcall(function()
    while true do
      local event, p1, p2 = os.pullEvent()

      if event == "websocket_success" then
        ws = p2
        if onStatus then onStatus("connected", ws) end
      elseif event == "websocket_message" then
        if onMessage then onMessage(p2, ws) end
      elseif event == "websocket_closed" then
        if onStatus then onStatus("closed") end
        break
      elseif event == "websocket_failure" then
        if onStatus then onStatus("failed: " .. tostring(p2)) end
        break
      end
    end
  end)

  if ws then ws.close() end
  if not ok then error(err, 2) end
end

return websocket
