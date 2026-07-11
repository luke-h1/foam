import { ViewerMilestoneTags } from '@app/types/chat/irc-tags/usernotice';
import { getTagValue } from '@app/utils/chat/formatSubscriptionNotice/getTagValue';
import { ParsedPart } from '@app/utils/chat/parsedPart';

export function createViewerMilestonePart(
  tags: ViewerMilestoneTags,
  messageText?: string,
): ParsedPart<'viewermilestone'> {
  const category = getTagValue(tags, 'msg-param-category');
  const reward = getTagValue(tags, 'msg-param-copoReward');
  const value = getTagValue(tags, 'msg-param-value');
  const content = messageText || '';

  const systemMsg = tags['system-msg'] ?? '';
  const login = tags.login ?? '';
  const displayName = tags['display-name'] ?? '';

  let constructedMessage = '';
  if (category === 'watch-streak' && displayName && value) {
    const streamCount = parseInt(value, 10);
    const streamText = streamCount === 1 ? 'stream' : 'streams';
    constructedMessage = `${displayName} watched ${value} consecutive ${streamText} and sparked a watch streak!`;
  } else if (systemMsg) {
    constructedMessage = systemMsg;
  }

  return {
    type: 'viewermilestone',
    category,
    reward,
    value,
    content,
    systemMsg: constructedMessage || systemMsg,
    login,
    displayName,
  };
}
