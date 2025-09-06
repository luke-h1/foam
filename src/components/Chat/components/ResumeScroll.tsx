/* eslint-disable react/no-unused-prop-types */
import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { Typography } from '@app/components/Typography';
import { LegendListRef } from '@legendapp/list';
import { RefObject } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface ResumeScrollProps {
  legendListRef: RefObject<LegendListRef | null>;
  isAtBottomRef: RefObject<boolean>;
  unreadCount: number;
  setIsAtBottom: (val: boolean) => void;
  setUnreadCount: (val: number) => void;
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
        {unreadCount > 0 && <Typography>{unreadCount}</Typography>}
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
