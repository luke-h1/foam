import { forwardRef, Ref } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button, ButtonProps } from '../Button';
import { Icon } from '../Icon';
import { Image } from '../Image';
import { Typography } from '../Typography';
import { SectionListItem } from './NavigationSectionList';

type NavigationSectionListItemButtonProps = ButtonProps & SectionListItem;

export const NavigationSectionListItemButton = forwardRef(
  (
    {
      title,
      iconName: icon,
      picture,
      description,
      onPress,
      ...props
    }: NavigationSectionListItemButtonProps,
    ref: Ref<View>,
  ) => {
    const { styles, theme } = useStyles(stylesheet);
    return (
      <Button {...props} ref={ref} onPress={e => onPress?.(e)}>
        <View style={styles.container}>
          <View style={styles.contentWrapper}>
            {icon && <Icon icon={icon} size={20} />}
            {picture && <Image source={picture} style={styles.image} />}
            <View style={styles.textWrapper}>
              <Typography size="sm" style={styles.title}>
                {title}
              </Typography>
              <Typography
                size="xs"
                style={styles.description}
                color="foregroundNeutral"
              >
                {description}
              </Typography>
            </View>
          </View>
          <Icon icon="arrow-right" size={20} color={theme.colors.foreground} />
        </View>
      </Button>
    );
  },
);
NavigationSectionListItemButton.displayName = 'NavigationSectionListItemButton';

const stylesheet = createStyleSheet(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    columnGap: theme.spacing.xl,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.xl,
  },
  textWrapper: {
    flexDirection: 'column',
    flexShrink: 1,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  description: {
    flexShrink: 1,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.brightPurple,
  },
  image: {
    width: 35,
    height: 35,
    borderRadius: theme.radii.xxl,
  },
  separator: {
    height: 0.55,
    backgroundColor: theme.colors.borderFaint,
    marginVertical: theme.spacing.sm,
  },
}));
