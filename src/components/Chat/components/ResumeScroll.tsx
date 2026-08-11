import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useChatUnreadCount } from '@app/store/chat/react/useChatUnreadCount';
import { theme } from '@app/styles/themes';

import { chatEntranceSpring } from '../util/chatEntranceSpring';

const resumeEntering = chatEntranceSpring(FadeInDown);
const resumeExiting = FadeOutDown.duration(150);

export interface ResumeScrollProps {
  onScrollToBottom: () => void;
}

function ResumeScrollComponent({ onScrollToBottom }: ResumeScrollProps) {
  const unreadCount = useChatUnreadCount();

  return (
    <Animated.View
      style={styles.resumeButtonContainer}
      entering={resumeEntering}
      exiting={resumeExiting}
    >
      <Button
        style={styles.resumeButton}
        onPress={onScrollToBottom}
        haptic='light'
      >
        <SymbolView
          name='arrow.down'
          size={16}
          tintColor={theme.colorAmberAlpha}
        />
        <Text style={styles.resumeText}>Jump to latest</Text>
        {unreadCount > 0 && (
          <Text style={styles.resumeCount}> {unreadCount}</Text>
        )}
      </Button>
    </Animated.View>
  );
}

export const ResumeScroll = memo(ResumeScrollComponent);

const styles = StyleSheet.create({
  resumeButton: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    borderWidth: 1,
    boxShadow: theme.shadow.sm.dark,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space12,
  },
  resumeButtonContainer: {
    alignSelf: 'center',
    bottom: theme.space20,
    position: 'absolute',
    zIndex: 10,
  },
  resumeCount: {
    fontSize: theme.fontSize12,
    fontWeight: '700',
  },
  resumeText: {
    fontSize: theme.fontSize12,
    fontWeight: '600',
  },
});
