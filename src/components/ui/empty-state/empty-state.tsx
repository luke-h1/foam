import {
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ContentUnavailableView, Host } from '@expo/ui/swift-ui';

import { ActionButton } from '@app/components/action-button/action-button';
import { type SFSymbol, SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';

/**
 * ContentUnavailableView is iOS 17+; its native body is empty on iOS 16, so
 * earlier versions keep the JS layout.
 */
const supportsContentUnavailableView =
  Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 17;

interface EmptyStateProps {
  heading: string;
  content?: string;
  iconName?: SFSymbol;
  /**
   * The label of the one action that fills or retries this state. Leave it
   * out when there is nothing useful to do.
   */
  button?: string;
  buttonOnPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Empty and error state for a screen or list, with at most one action. It
 * fades in so the switch from content or a skeleton is not abrupt.
 */
export function EmptyState({
  heading,
  content,
  iconName = 'tv',
  button,
  buttonOnPress,
  style,
}: EmptyStateProps) {
  const action =
    button && buttonOnPress ? (
      <ActionButton
        title={button}
        size='small'
        onPress={buttonOnPress}
        style={styles.action}
      />
    ) : null;

  if (supportsContentUnavailableView) {
    return (
      <Animated.View
        entering={FadeIn.duration(motion.medium)}
        style={[styles.container, style]}
      >
        <Host style={styles.iosHost}>
          <ContentUnavailableView
            title={heading}
            systemImage={iconName}
            description={content}
          />
        </Host>
        {action}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(motion.medium)}
      style={[styles.container, style]}
    >
      <View style={styles.body}>
        <SymbolView
          name={iconName}
          size={44}
          tintColor={theme.color.textSecondary.dark}
        />

        <Text type='title3' align='center' style={styles.heading}>
          {heading}
        </Text>

        {content ? (
          <Text
            type='subhead'
            align='center'
            color='gray.textLow'
            style={styles.content}
          >
            {content}
          </Text>
        ) : null}
      </View>
      {action}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: theme.space44,
    paddingHorizontal: theme.space28,
  },
  body: {
    alignItems: 'center',
    maxWidth: 360,
  },
  heading: {
    marginTop: theme.space16,
  },
  content: {
    marginTop: theme.space8,
  },
  action: {
    marginTop: theme.space20,
  },
  iosHost: {
    alignSelf: 'stretch',
    flex: 1,
  },
});
