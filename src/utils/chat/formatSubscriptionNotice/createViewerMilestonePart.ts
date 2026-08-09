import { ViewerMilestoneTags } from '@app/types/chat/irc-tags/usernotice';
import { withNoticeSubject } from '@app/utils/chat/chatHealth/withNoticeSubject';
import { getTagValue } from '@app/utils/chat/formatSubscriptionNotice/getTagValue';
import { ParsedPart } from '@app/utils/chat/parsedPart';

export function createViewerMilestonePart(
  tags: ViewerMilestoneTags,
  messageText?: string,
): ParsedPart<'viewermilestone'> {
  const category = getTagValue(tags, 'msg-param-category');
  const value = getTagValue(tags, 'msg-param-value');
  const displayName = getTagValue(tags, 'display-name');
  const systemMsg = withNoticeSubject(
    getTagValue(tags, 'system-msg'),
    displayName,
  );
  const streamCount = Number.parseInt(value, 10);
  const fallback =
    category === 'watch-streak' && displayName && value
      ? `${displayName} watched ${value} consecutive ${
          streamCount === 1 ? 'stream' : 'streams'
        } and sparked a watch streak!`
      : '';

  return {
    type: 'viewermilestone',
    category,
    reward: getTagValue(tags, 'msg-param-copoReward'),
    value,
    content: messageText?.trim() ?? '',
    systemMsg: systemMsg || fallback,
    login: getTagValue(tags, 'login'),
    displayName,
  };
}
