local display = require("display")
local speaker = require("speaker")

local function formatStatus(status)
  return status or "Idle"
end

local function main()
  display.init()

  local currentUsers = {}

  local function updateUsers(users)
    currentUsers = users or {}
    display.setUsers(currentUsers)
  end

  local function removeUser(userId)
    for i = #currentUsers, 1, -1 do
      if currentUsers[i].userId == userId then
        table.remove(currentUsers, i)
      end
    end
    display.setUsers(currentUsers)
  end

  local app = speaker.create({
    onUserList = function(users)
      updateUsers(users)
      display.setStatus("Channel joined")
    end,
    onUserJoin = function(user)
      table.insert(currentUsers, user)
      display.setUsers(currentUsers)
      display.setStatus(user.displayName .. " joined")
    end,
    onUserLeave = function(userId)
      removeUser(userId)
      display.setStatus("User left: " .. userId)
    end,
    onChannelLeave = function()
      updateUsers({})
      display.setStatus("Bot left channel")
    end,
    onStatus = function(status)
      display.setStatus(formatStatus(status))
    end,
    onActiveUsers = function(active)
      display.setActive(active)
    end,
  })

  parallel.waitForAll(app.receiver, app.player)
end

main()
