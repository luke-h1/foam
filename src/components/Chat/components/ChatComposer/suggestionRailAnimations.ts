import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { chatEntranceSpring } from '@app/components/Chat/util/chatEntranceSpring';

export const suggestionRailEntering = chatEntranceSpring(FadeInDown);

export const suggestionRailExiting = FadeOutDown.duration(130);
