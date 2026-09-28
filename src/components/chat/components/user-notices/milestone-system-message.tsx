import { type StyleProp, type TextStyle } from 'react-native';

import { Text } from '@app/components/ui/text/text';

import { styles } from '../chat-message/chat-row.styles';

/**
 * Twitch's own wording for the milestone, with the chatter's name picked out
 * of it so only the name is emphasised.
 */
export function MilestoneSystemMessage({
  lead,
  rest,
  style,
}: {
  lead: string | undefined;
  rest: string | undefined;
  style: StyleProp<TextStyle>;
}) {
  return (
    <Text style={style}>
      {lead ? (
        <Text style={[style, styles.channelPointsMetaName]}>{lead}</Text>
      ) : null}
      {rest ? (
        <Text style={[style, styles.channelPointsMetaMuted]}>
          {lead ? ` ${rest}` : rest}
        </Text>
      ) : null}
    </Text>
  );
}
