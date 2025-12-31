import { useCallback } from 'react';

interface UseSuggestionAnimationsProps {
  shouldShow: boolean;
  onHideComplete?: () => void;
}

export function useSuggestionAnimations({
  shouldShow,
  onHideComplete,
}: UseSuggestionAnimationsProps) {
  // Return simple values without animations
  const opacity = shouldShow ? 1 : 0;
  const scale = shouldShow ? 1 : 0.95;
  const translateY = shouldShow ? 0 : -10;

  const hide = useCallback(() => {
    if (onHideComplete) {
      onHideComplete();
    }
  }, [onHideComplete]);

  return {
    opacity,
    scale,
    translateY,
    hide,
  };
}
