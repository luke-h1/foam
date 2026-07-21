import { memo, useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { chatEntranceSpring } from '../util/chatEntranceSpring';

const resumeEntering = chatEntranceSpring(FadeInDown);
const resumeExiting = FadeOutDown.duration(150);

export interface ResumeScrollProps {
  unreadCount: number;
  onScrollToBottom: () => void;
}

function ResumeScrollComponent({
  onScrollToBottom,
  unreadCount,
}: ResumeScrollProps) {
  const { t } = useTranslation('chat');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const resumeButtonColors = useMemo(
    () => ({
      backgroundColor: theme.color.backgroundAltAlpha[scheme],
      borderColor: theme.color.border[scheme],
    }),
    [scheme],
  );

  return (
    <Animated.View
      style={styles.resumeButtonContainer}
      entering={resumeEntering}
      exiting={resumeExiting}
    >
      <Button
        style={[styles.resumeButton, resumeButtonColors]}
        onPress={onScrollToBottom}
        haptic='light'
      >
        <SymbolView
          name='arrow.down'
          size={16}
          tintColor={theme.color.amberAlpha[scheme]}
        />
        <Text style={styles.resumeText}>{t('controls.jumpToLatest')}</Text>
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    borderWidth: 1,
    boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)',
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
