import { makeMutable } from 'react-native-reanimated';

import { chatScrollActivity } from '@app/components/chat/util/chat-scroll-activity';

/**
 * UI-thread mirror of `chatScrollActivity`, for worklets that shed work during
 * a fling without a React re-render.
 */
export const chatScrollActiveShared = makeMutable(false);

chatScrollActivity.subscribe(active => {
  chatScrollActiveShared.value = active;
});
