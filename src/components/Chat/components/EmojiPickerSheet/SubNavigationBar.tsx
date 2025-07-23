import { Button } from '@app/components/Button';
import { Typography } from '@app/components/Typography';
import { ScrollView } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { CATEGORY_HEADER_HEIGHT, PICKER_PAD, PICKER_WIDTH } from './config';

type SubNavigationOption = {
  key: string;
  label: string;
};

export function SubNavigationBar({
  options,
  activeKey,
  onPress,
}: {
  options: SubNavigationOption[];
  activeKey: string;
  onPress?: (key: string) => void;
}) {
  const { theme, styles } = useStyles(stylesheet);

  return (
    <ScrollView
      style={[styles.subNavBar, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={styles.subNavContent}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map(option => (
        <Button
          key={option.key}
          onPress={() => onPress?.(option.key)}
          style={[
            styles.subNavItem,
            activeKey === option.key && {
              backgroundColor: theme.colors.borderNeutral,
            },
          ]}
        >
          <Typography
            style={[styles.subNavLabel, { color: theme.colors.text }]}
          >
            {option.label}
          </Typography>
        </Button>
      ))}
    </ScrollView>
  );
}

const stylesheet = createStyleSheet(theme => ({
  subNavBar: {
    position: 'absolute',
    top: CATEGORY_HEADER_HEIGHT,
    left: -PICKER_PAD,
    width: PICKER_WIDTH + 2 * PICKER_PAD,
    zIndex: 1,
    height: theme.spacing['4xl'],
  },
  subNavContent: {
    padding: PICKER_PAD,
    gap: theme.spacing.md,
  },
  subNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    gap: theme.spacing.sm,
  },
  subNavIcon: {
    fontSize: theme.spacing.sm,
  },
  subNavLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
}));
