import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/Text/Text';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface ResumeScrollProps {
  unreadCount: number;
  onScrollToBottom: () => void;
}

export function ResumeScroll({
  onScrollToBottom,
  unreadCount,
}: ResumeScrollProps) {
  const { theme } = useUnistyles();
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

const styles = StyleSheet.create(theme => ({
  resumeButtonContainer: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    alignSelf: 'center',
    zIndex: 10,
  },
  resumeButton: {
    backgroundColor: theme.colors.black.bgAlpha,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.black.accentAlpha,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}));
