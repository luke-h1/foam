import {
  type StyleProp,
  // eslint-disable-next-line no-restricted-imports
  StyleSheet,
  type TextStyle,
  useColorScheme,
  View,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';

import { Button } from '@app/components/Button/Button';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

type EmptyLayoutVariant = 'default' | 'outline';
type EmptyMediaVariant = 'icon' | 'illustration';

export function EmptyLayout({
  children,
  variant = 'default',
  style,
}: {
  children: ReactNode;
  variant?: EmptyLayoutVariant;
  style?: StyleProp<ViewStyle>;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View
      style={[
        styles.empty,
        variant === 'outline'
          ? [
              styles.emptyOutline,
              {
                backgroundColor: theme.color.backgroundAltAlpha[scheme],
                borderColor: theme.color.border[scheme],
              },
            ]
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function EmptyLayoutHeader({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function EmptyLayoutMedia({
  children,
  variant = 'icon',
  style,
}: {
  children: ReactNode;
  variant?: EmptyMediaVariant;
  style?: StyleProp<ViewStyle>;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View
      style={[
        styles.media,
        variant === 'icon'
          ? [
              styles.mediaIcon,
              {
                backgroundColor: theme.color.backgroundAltAlpha[scheme],
                borderColor: theme.color.border[scheme],
              },
            ]
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function EmptyLayoutTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <Text
      style={[styles.title, { color: theme.color.text[scheme] }, style]}
      type='2xl'
      weight='semibold'
    >
      {children}
    </Text>
  );
}

export function EmptyLayoutDescription({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <Text
      style={[
        styles.description,
        { color: theme.color.textSecondary[scheme] },
        style,
      ]}
      type='default'
    >
      {children}
    </Text>
  );
}

export function EmptyLayoutContent({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function EmptyLayoutButton({
  title,
  children,
  variant = 'default',
  onPress,
  style,
}: {
  title?: string;
  children?: ReactNode;
  variant?: EmptyLayoutVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  if (title) {
    return (
      <View style={style}>
        <Button
          disabled={!onPress}
          label={title}
          onPress={onPress}
          style={[
            styles.ctaButton,
            { backgroundColor: theme.color.accent[scheme] },
            variant === 'outline' && [
              styles.ctaButtonOutline,
              { borderColor: theme.color.border[scheme] },
            ],
          ]}
        >
          <Text
            type='sm'
            weight='semibold'
            align='center'
            style={
              variant === 'outline'
                ? { color: theme.color.text[scheme] }
                : { color: theme.color.onAccent[scheme] }
            }
          >
            {title}
          </Text>
        </Button>
      </View>
    );
  }

  if (!children) {
    return null;
  }

  if (!onPress) {
    return <View style={style}>{children}</View>;
  }

  return (
    <PressableArea onPress={onPress} style={style}>
      {children}
    </PressableArea>
  );
}

const styles = StyleSheet.create({
  ctaButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    justifyContent: 'center',
    minWidth: 140,
    paddingHorizontal: theme.space24,
    paddingVertical: theme.space12,
  },
  ctaButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.space28,
  },
  description: {
    lineHeight: 24,
    paddingHorizontal: theme.space20,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    justifyContent: 'center',
    minHeight: 400,
    padding: theme.space44,
  },
  emptyOutline: {
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  media: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space28,
  },
  mediaIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  title: {
    marginBottom: theme.space16,
    textAlign: 'center',
  },
});
