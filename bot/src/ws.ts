import { createServer } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { env } from "./env.js";
import { voiceReceiver } from "./voice/receiver.js";
import { convertToDFPWM } from "./voice/conversion.js";

export const MSG_TYPE_VOICE = 1 << 0;
export const MSG_TYPE_CONTROL = 1 << 1;

export interface UserInfo {
  userId: string;
  displayName: string;
}

export type ControlMessage =
  | { type: "userList"; users: UserInfo[] }
  | { type: "userJoin"; user: UserInfo }
  | { type: "userLeave"; userId: string }
  | { type: "channelLeave" };

const clients = new Set<WebSocket>();
const currentUsers = new Map<string, UserInfo>();

function makeControlFrame(msg: ControlMessage): Buffer {
  const json = Buffer.from(JSON.stringify(msg), "utf8");
  const frame = Buffer.alloc(1 + json.length);
  frame[0] = MSG_TYPE_CONTROL;
  json.copy(frame, 1);
  return frame;
}

function makeVoiceFrame(userId: string, dfpwm: Buffer): Buffer {
  const header = Buffer.alloc(20);
  header[0] = MSG_TYPE_VOICE;
  header.write(userId.padEnd(19), 1, "ascii");
  return Buffer.concat([header, dfpwm]);
}

function sendTo(ws: WebSocket, frame: Buffer) {
  if (ws.readyState === ws.OPEN) ws.send(frame);
}

function broadcast(frame: Buffer) {
  for (const client of clients) sendTo(client, frame);
}

export function notifyChannelJoin(users: UserInfo[]) {
  currentUsers.clear();
  for (const u of users) currentUsers.set(u.userId, u);
  broadcast(makeControlFrame({ type: "userList", users }));
}

export function notifyChannelLeave() {
  currentUsers.clear();
  broadcast(makeControlFrame({ type: "channelLeave" }));
}

export function notifyUserJoin(user: UserInfo) {
  currentUsers.set(user.userId, user);
  broadcast(makeControlFrame({ type: "userJoin", user }));
}

export function notifyUserLeave(userId: string) {
  currentUsers.delete(userId);
  broadcast(makeControlFrame({ type: "userLeave", userId }));
}

function validateToken(requestUrl: string | undefined, host: string | undefined) {
  if (!requestUrl) return false;
  const url = new URL(requestUrl, `http://${host ?? "localhost"}`);
  const token = url.searchParams.get("token");
  return token === env.WS_TOKEN;
}

export function startWebsocketServer() {
  const port = Number(env.WS_PORT ?? "8080");
  const server = createServer((req, res) => {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (!validateToken(request.url, request.headers.host)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    // send current snapshot to newly connected client
    sendTo(ws, makeControlFrame({ type: "userList", users: Array.from(currentUsers.values()) }));
    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  });

  voiceReceiver.on("voicePacket", async (packet) => {
    const dfpwm = await convertToDFPWM(packet.opusPacket, packet.userId);
    broadcast(makeVoiceFrame(packet.userId, dfpwm));
  });

  server.listen(port, () => {
    console.log(`WebSocket server listening on ws://0.0.0.0:${port}/?token=<token>`);
  });
}
