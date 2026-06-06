import { Encoder as DFPWMEncoder } from "dfpwm";
import { OpusDecoder } from "opus-decoder";

// per discord user encoder to maintain state across packets
const userEncoders = new Map<string, DFPWMEncoder>();

function getEncoder(userId: string): DFPWMEncoder {
  if (!userEncoders.has(userId)) {
    userEncoders.set(userId, new DFPWMEncoder());
  }
  return userEncoders.get(userId)!;
}

export async function convertToDFPWM(opusPacket: Buffer, userId: string): Promise<string> {
  const decoder = new OpusDecoder({ sampleRate: 48000, channels: 1 });
  await decoder.ready;
  const { channelData } = decoder.decodeFrame(opusPacket);
  decoder.free();

  // float32 -> int8
  const pcm = channelData[0];
  const int8 = Buffer.alloc(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    int8[i] = Math.max(-128, Math.min(127, Math.floor(pcm[i] * 128)));
  }

  const encoder = getEncoder(userId);
  const dfpwm = encoder.encode(int8);
  return dfpwm.toString("base64");
}
