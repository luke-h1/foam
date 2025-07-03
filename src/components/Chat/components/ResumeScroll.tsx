import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { Typography } from '@app/components/Typography';
import { LegendListRef } from '@legendapp/list';
import { RefObject } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

interface ResumeScrollProps {
  legendListRef: RefObject<LegendListRef | null>;
  isAtBottomRef: RefObject<boolean>;
  unreadCount: number;
  setIsAtBottom: (val: boolean) => void;
  setUnreadCount: (num: number) => void;
}

export function ResumeScroll({
  isAtBottomRef,
  legendListRef,
  setIsAtBottom,
  setUnreadCount,
  unreadCount,
}: ResumeScrollProps) {
  const { styles, theme } = useStyles(stylesheet);
  return (
    <View style={styles.resumeButtonContainer}>
      <Button
        style={styles.resumeButton}
        onPress={() => {
          legendListRef.current?.scrollToEnd({ animated: true });
          // eslint-disable-next-line no-param-reassign
          isAtBottomRef.current = true;
          setIsAtBottom(true);
          setUnreadCount(0);
        }}
      >
        <Icon icon="arrow-down" size={16} color={theme.colors.text} />
        {unreadCount > 0 && (
          <Typography weight="semiBold" size="md">
            {unreadCount}
          </Typography>
        )}
      </Button>
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  resumeButtonContainer: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    alignSelf: 'center',
    zIndex: 10,
  },
  resumeButton: {
    backgroundColor: theme.colors.brightPurple,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.border,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}));
