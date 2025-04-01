/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GlobalUserState, RoomState, UserState } from '@twurple/chat';
import {
  GlobalUserStateTags,
  UserStateTags,
  RoomStateTags,
} from '../slices/chat/types';
import parseBadgesTag from './parseBadgesTag';

export const parseGlobalUserState = (
  msg: GlobalUserState,
): GlobalUserStateTags => {
  const { tags } = msg;

  return {
    badgeInfo: parseBadgesTag(tags.get('badge-info')!),
    badges: parseBadgesTag(tags.get('badges')!),
    color: tags.get('color'),
    displayName: tags.get('display-name'),
    emoteSets: tags.get('emote-sets')!.split(','),
    userId: tags.get('user-id')!,
    userType: tags.get('user-type') as GlobalUserStateTags['userType'],
  };
};

export const parseUserState = (msg: UserState): UserStateTags => {
  const { tags } = msg;

  return {
    badgeInfo: parseBadgesTag(tags.get('badge-info')!),
    badges: parseBadgesTag(tags.get('badges')!),
    color: tags.get('color'),
    displayName: tags.get('display-name'),
    emoteSets: tags.get('emote-sets')!.split(','),
    mod: tags.get('mod') === '1',
    subscriber: tags.get('subscriber') === '1',
    userType: tags.get('user-type') as GlobalUserStateTags['userType'],
  };
};

export const parseRoomState = (msg: RoomState): RoomStateTags => {
  const { tags } = msg;
  const followersOnly = tags.get('followers-only');

  return {
    emoteOnly: tags.get('emote-only') === '1',
    followersOnly:
      followersOnly === '-1' ? false : Number.parseInt(followersOnly!, 10),
    r9k: tags.get('r9k') === '1',
    roomId: tags.get('room-id')!,
    slow: Number.parseInt(tags.get('slow')!, 10),
    subsOnly: tags.get('subs-only') === '',
  };
};
