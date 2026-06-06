import { EventEmitter } from "events";
import { EndBehaviorType, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import type { Readable } from "stream";

export namespace VoiceReceiverEvent {
  export const VoicePacket = "voicePacket" as const;
  export type VoicePacket = typeof VoicePacket;
}

export interface VoicePacketEvent {
  guildId: string;
  userId: string;
  createdAt: number;
  opusPacket: Buffer;
}

export interface VoiceReceiverEvents {
  [VoiceReceiverEvent.VoicePacket]: (packet: VoicePacketEvent) => void;
}

export class VoiceReceiver extends EventEmitter {
  override on<U extends keyof VoiceReceiverEvents>(event: U, listener: VoiceReceiverEvents[U]): this {
    return super.on(event, listener);
  }

  override once<U extends keyof VoiceReceiverEvents>(event: U, listener: VoiceReceiverEvents[U]): this {
    return super.once(event, listener);
  }

  override emit<U extends keyof VoiceReceiverEvents>(event: U, ...args: Parameters<VoiceReceiverEvents[U]>): boolean {
    return super.emit(event, ...args);
  }
}

const receiverAttachments = new Set<string>();
export const voiceReceiver = new VoiceReceiver();

export function attachVoiceReceiver(connection: VoiceConnection, guildId: string) {
  if (receiverAttachments.has(guildId)) {
    return;
  }
  receiverAttachments.add(guildId);

  const subscriptions = new Map<string, Readable>();

  const cleanupSubscription = (userId: string) => {
    const stream = subscriptions.get(userId);
    if (!stream) return;
    stream.destroy();
    subscriptions.delete(userId);
  };

  connection.receiver.speaking.on("start", (userId) => {
    if (subscriptions.has(userId)) return;

    const opusStream = connection.receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: 1000 },
    });

    subscriptions.set(userId, opusStream);

    opusStream.on("data", (chunk: Buffer) => {
      voiceReceiver.emit(VoiceReceiverEvent.VoicePacket, {
        guildId,
        userId,
        createdAt: Date.now(),
        opusPacket: chunk,
      });
    });

    opusStream.on("end", () => cleanupSubscription(userId));
    opusStream.on("error", () => cleanupSubscription(userId));
  });

  connection.receiver.speaking.on("end", cleanupSubscription);

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    subscriptions.forEach((stream) => stream.destroy());
    subscriptions.clear();
    receiverAttachments.delete(guildId);
  });
}
