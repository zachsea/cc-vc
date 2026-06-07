local display = {}

local mon
local users = {}
local activeUserIds = {}
local statusText = "Starting..."

local function findMonitor()
  mon = peripheral.find("monitor")
  if not mon then
    error("No monitor peripheral found. Attach a monitor and try again.")
  end
  mon.setTextScale(1)
  mon.setBackgroundColor(colors.black)
  mon.setTextColor(colors.white)
  mon.clear()
end

local function isActive(userId)
  return activeUserIds[userId]
end

function display.refresh()
  if not mon then return end
  mon.clear()
  mon.setCursorPos(1, 1)
  mon.write("Voice Channel")
  mon.setCursorPos(1, 2)
  mon.write("Users")
  mon.setCursorPos(1, 3)
  mon.write(string.rep("-", 20))

  local line = 4
  if #users == 0 then
    mon.setCursorPos(1, line)
    mon.setTextColor(colors.white)
    mon.write("No users in channel")
    line = line + 1
  else
    for _, user in ipairs(users) do
      mon.setCursorPos(1, line)
      local marker = isActive(user.userId) and "*" or " "
      if isActive(user.userId) then
        mon.setTextColor(colors.green)
      else
        mon.setTextColor(colors.white)
      end
      mon.write(marker .. " " .. user.displayName)
      line = line + 1
    end
  end

  mon.setCursorPos(1, line + 1)
  mon.setTextColor(colors.white)
  mon.write("Status: " .. statusText)
end

function display.setUsers(userList)
  users = userList or {}
  display.refresh()
end

function display.setActive(userIds)
  activeUserIds = {}
  for _, userId in ipairs(userIds or {}) do
    activeUserIds[userId] = true
  end
  display.refresh()
end

function display.setStatus(text)
  statusText = text or ""
  display.refresh()
end

function display.init()
  findMonitor()
  display.refresh()
end

return display
