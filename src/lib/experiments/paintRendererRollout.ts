import { observable } from '@legendapp/state';

export const paintRendererRollout$ = observable<'native' | 'skia'>('native');
