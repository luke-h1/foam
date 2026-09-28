import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { chatEntranceSpring } from '@app/components/chat/util/chat-entrance-spring';

export const suggestionRailEntering = chatEntranceSpring(FadeInDown);

export const suggestionRailExiting = FadeOutDown.duration(130);
