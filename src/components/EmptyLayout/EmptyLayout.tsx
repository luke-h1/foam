import type { ReactNode } from 'react';
import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import {
  // eslint-disable-next-line no-restricted-imports
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

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
  return (
    <View
      style={[
        styles.empty,
        variant === 'outline' ? styles.emptyOutline : null,
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
  return (
    <View
      style={[
        styles.media,
        variant === 'icon' ? styles.mediaIcon : null,
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
  return (
    <Text style={[styles.title, style]} type='2xl' weight='semibold'>
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
  return (
    <Text style={[styles.description, style]} type='default'>
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
  if (title) {
    return (
      <View style={style}>
        <Button
          disabled={!onPress}
          onPress={onPress}
          style={[
            styles.ctaButton,
            variant === 'outline' && styles.ctaButtonOutline,
          ]}
        >
          <Text
            type='sm'
            weight='semibold'
            align='center'
            style={
              variant === 'outline' ? styles.ctaTextOutline : styles.ctaText
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
  // Native bordered-prominent style: content-hugging, centered label,
  // continuous-curve capsule.
  ctaButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    justifyContent: 'center',
    minWidth: 140,
    paddingHorizontal: theme.space24,
    paddingVertical: theme.space12,
  },
  ctaButtonOutline: {
    backgroundColor: 'transparent',
    borderColor: theme.colorBorderSecondary,
    borderWidth: 1,
  },
  ctaText: {
    color: theme.colorBlack,
  },
  ctaTextOutline: {
    color: theme.color.text.dark,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.space28,
  },
  description: {
    color: theme.color.textSecondary.dark,
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
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
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
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  title: {
    color: theme.color.text.dark,
    marginBottom: theme.space16,
    textAlign: 'center',
  },
});
