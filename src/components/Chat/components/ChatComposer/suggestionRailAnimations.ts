import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { chatEntranceSpring } from '@app/components/Chat/util/chatEntranceSpring';

/**
 * Shared entrance/exit motion for the composer suggestion rails (emote,
 * command, mention). Kept in one place so all three rails stay in sync.
 *
 * The rail sits directly above the input, so it emerges upward out of the
 * composer on enter (the shared chat entrance spring) and settles back down
 * toward it on exit - the same path in both directions, anchored to the
 * control that spawned it.
 */
export const suggestionRailEntering = chatEntranceSpring(FadeInDown);

export const suggestionRailExiting = FadeOutDown.duration(130);
