import { createServer } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { env } from "./env.js";
import { voiceReceiver, VoiceReceiverEvent } from "./voice/receiver.js";
import { convertToDFPWM } from "./voice/conversion.js";

export interface VoiceWebSocketMessage {
  type: "voicePacket";
  guildId: string;
  userId: string;
  createdAt: number;
  format: "dfpwm";
  data: Buffer;
  sampleRate: 48000;
}

const clients = new Set<WebSocket>();

function broadcastVoicePacket(packet: VoiceWebSocketMessage) {
  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      const header = Buffer.alloc(19);
      header.write(packet.userId.padEnd(19), 0, "ascii");
      const frame = Buffer.concat([header, packet.data]);
      client.send(frame);
    }
  }
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
    ws.send(JSON.stringify({ type: "connected", message: "Voice websocket connected" }));

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("error", () => {
      clients.delete(ws);
    });
  });

  voiceReceiver.on(VoiceReceiverEvent.VoicePacket, async (packet) => {
    const dfpwmData = await convertToDFPWM(packet.opusPacket, packet.userId);
    broadcastVoicePacket({
      type: "voicePacket",
      guildId: packet.guildId,
      userId: packet.userId,
      createdAt: packet.createdAt,
      format: "dfpwm",
      data: dfpwmData,
      sampleRate: 48000,
    });
  });

  server.listen(port, () => {
    console.log(`WebSocket server listening on ws://0.0.0.0:${port}/?token=<token>`);
  });
}
