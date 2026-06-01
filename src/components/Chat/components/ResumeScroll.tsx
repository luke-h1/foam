import { Button } from '@app/components/Button/Button';
import { SymbolView } from 'expo-symbols';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';
import { memo } from 'react';

export interface ResumeScrollProps {
  unreadCount: number;
  onScrollToBottom: () => void;
}

function ResumeScrollComponent({
  onScrollToBottom,
  unreadCount,
}: ResumeScrollProps) {
  return (
    <View style={styles.resumeButtonContainer}>
      <Button style={styles.resumeButton} onPress={onScrollToBottom}>
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
    </View>
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
    elevation: 5,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space12,
    shadowColor: theme.colorBlackAlpha,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
