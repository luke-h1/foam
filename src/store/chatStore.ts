import { SevenTvEmote } from '@app/utils/third-party/types';
import { create } from 'zustand';

interface ChatState {
  sevenTvGlobalEmotes: SevenTvEmote[];
}
