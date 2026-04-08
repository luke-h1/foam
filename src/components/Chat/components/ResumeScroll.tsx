import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';

export interface ResumeScrollProps {
  unreadCount: number;
  onScrollToBottom: () => void;
}

export function ResumeScroll({
  onScrollToBottom,
  unreadCount,
}: ResumeScrollProps) {
  return (
    <View style={styles.resumeButtonContainer}>
      <Button style={styles.resumeButton} onPress={onScrollToBottom}>
        <Icon
          icon="arrow-down"
          size={16}
          color={theme.colors.amber.accentAlpha}
        />
        {unreadCount > 0 && <Text>{unreadCount}</Text>}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  resumeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.bgAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    elevation: 5,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    shadowColor: theme.colors.black.accentAlpha,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resumeButtonContainer: {
    alignSelf: 'center',
    bottom: theme.spacing.lg,
    position: 'absolute',
    zIndex: 10,
  },
});
