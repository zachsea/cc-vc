import { Encoder as DFPWMEncoder } from "dfpwm";
import { OpusDecoder } from "opus-decoder";

// per discord user encoder to maintain state across packets
const userEncoders = new Map<string, DFPWMEncoder>();
const userOpusDecoders = new Map<string, OpusDecoder<48000>>();

function getEncoder(userId: string): DFPWMEncoder {
  if (!userEncoders.has(userId)) {
    userEncoders.set(userId, new DFPWMEncoder());
  }
  return userEncoders.get(userId)!;
}

async function getOpusDecoder(userId: string): Promise<OpusDecoder<48000>> {
  if (!userOpusDecoders.has(userId)) {
    const decoder = new OpusDecoder({ sampleRate: 48000, channels: 1 });
    await decoder.ready;
    userOpusDecoders.set(userId, decoder);
  }
  return userOpusDecoders.get(userId)!;
}

const userSilenceTimers = new Map<string, NodeJS.Timeout>();

function resetSilenceTimer(userId: string) {
  const existing = userSilenceTimers.get(userId);
  if (existing) clearTimeout(existing);
  userSilenceTimers.set(
    userId,
    setTimeout(async () => {
      const decoder = userOpusDecoders.get(userId);
      if (decoder) {
        await decoder.free();
        userOpusDecoders.delete(userId);
      }
      userEncoders.delete(userId);
      userSilenceTimers.delete(userId);
    }, 10_000)
  );
}

export async function convertToDFPWM(opusPacket: Buffer, userId: string): Promise<Buffer> {
  const decoder = await getOpusDecoder(userId); // reuse, never free between frames
  resetSilenceTimer(userId);

  const { channelData } = await decoder.decodeFrame(opusPacket);

  const pcm = channelData[0];
  const int8 = Buffer.alloc(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    int8[i] = Math.max(-128, Math.min(127, Math.round(pcm[i] * 128)));
  }

  const encoder = getEncoder(userId);
  return encoder.encode(int8);
}
