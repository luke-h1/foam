import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { Button } from '@app/components/button/button';
import { SymbolView } from '@app/components/ui/icon/icon';
import { theme } from '@app/styles/themes';

import type { FullscreenChatMode } from '../types';

/**
 * Floating chat controls shown over the player in landscape: show/hide chat,
 * and switch between the sidebar and overlay layouts.
 */
export function LandscapeChatControls({
  animatedStyle,
  fullscreenChatMode,
  isChatVisible,
  onToggleChat,
  onToggleMode,
  topOffset,
}: {
  animatedStyle: AnimatedStyle<ViewStyle>;
  fullscreenChatMode: FullscreenChatMode;
  isChatVisible: boolean;
  onToggleChat: () => void;
  onToggleMode: () => void;
  topOffset: number;
}) {
  const isOverlay = fullscreenChatMode === 'overlay';

  return (
    <Animated.View
      pointerEvents='box-none'
      style={[styles.controls, { top: topOffset }, animatedStyle]}
    >
      <Button
        label={isChatVisible ? 'Hide chat' : 'Show chat'}
        onPress={onToggleChat}
        style={styles.button}
      >
        <SymbolView
          tintColor={theme.colorWhite}
          name={isChatVisible ? 'eye.slash' : 'message'}
          size={14}
          style={styles.icon}
        />
      </Button>

      <Button
        label={isOverlay ? 'Use sidebar chat' : 'Use overlay chat'}
        onPress={onToggleMode}
        style={styles.button}
      >
        <SymbolView
          tintColor={theme.colorWhite}
          name={isOverlay ? 'sidebar.left' : 'rectangle.split.2x1'}
          size={14}
          style={styles.icon}
        />
      </Button>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  controls: {
    flexDirection: 'row',
    gap: theme.space8,
    position: 'absolute',
    zIndex: 12,
  },
  icon: {
    opacity: 0.75,
  },
});
