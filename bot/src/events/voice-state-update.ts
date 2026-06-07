import { Events, type VoiceBasedChannel, type VoiceState } from "discord.js";
import { notifyChannelJoin, notifyChannelLeave, notifyUserJoin, notifyUserLeave, type UserInfo } from "../ws.js";

function memberToUserInfo(member: { id: string; displayName: string }): UserInfo {
  return { userId: member.id, displayName: member.displayName };
}

export function onBotJoinChannel(channel: VoiceBasedChannel) {
  const users = channel.members.filter((m) => !m.user.bot).map(memberToUserInfo);
  notifyChannelJoin(users);
}

export const name: Events = Events.VoiceStateUpdate;
export const once = false;
export async function execute(oldState: VoiceState, newState: VoiceState) {
  const oldMember = oldState.member;
  const newMember = newState.member;

  const isBotStateUpdate = oldMember?.user.bot || newMember?.user.bot;
  if (isBotStateUpdate) {
    const botJoinedChannel = !oldState.channelId && newState.channelId;
    const botLeftChannel = oldState.channelId && !newState.channelId;
    const botMovedChannel = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

    if (botMovedChannel) {
      notifyChannelLeave();
      onBotJoinChannel(newState.channel!);
    }

    if (botJoinedChannel) {
      onBotJoinChannel(newState.channel!);
    }

    if (botLeftChannel) {
      notifyChannelLeave();
    }

    return;
  }

  const botChannelId = newState.guild?.members.me?.voice.channelId ?? oldState.guild?.members.me?.voice.channelId;
  if (!botChannelId) return;

  const userId = newMember?.id ?? oldMember?.id;
  const displayName = newMember?.displayName ?? oldMember?.displayName;
  if (!userId || !displayName) return;

  const joinedOurChannel = newState.channelId === botChannelId && oldState.channelId !== botChannelId;
  const leftOurChannel = oldState.channelId === botChannelId && newState.channelId !== botChannelId;

  if (joinedOurChannel) notifyUserJoin({ userId, displayName });
  if (leftOurChannel) notifyUserLeave(userId);
}
