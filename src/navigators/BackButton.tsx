import { Button } from '@app/components/Button/Button';
import { SymbolView } from 'expo-symbols';
import { theme } from '@app/styles/themes';
import { router } from 'expo-router';

// Component which implements a back button for the navigation bar
export function BackButton() {
  if (router.canGoBack()) {
    return (
      <Button label='Back' onPress={() => router.back()}>
        <SymbolView
          name='arrow.left'
          size={18}
          tintColor={theme.colorGreyHoverAlpha}
        />
      </Button>
    );
  }

  return null;
}
