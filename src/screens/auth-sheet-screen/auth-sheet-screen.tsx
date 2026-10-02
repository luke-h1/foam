import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { ActionButton } from '@app/components/action-button/action-button';
import { Button } from '@app/components/button/button';
import { Image } from '@app/components/image/image';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { useTwitchSignIn } from '@app/hooks/use-twitch-sign-in';
import { theme } from '@app/styles/themes';

function handleAuthSuccess() {
  if (router.canDismiss()) {
    router.dismiss();
    return;
  }

  router.replace('/tabs/following');
}

function handleDismiss() {
  if (router.canDismiss()) {
    router.dismiss();
    return;
  }

  router.back();
}

const BENEFITS = [
  { icon: 'person.2', label: 'Your followed channels, live first' },
  { icon: 'bubble.left.and.bubble.right', label: 'Chat as yourself' },
  { icon: 'face.smiling', label: 'Emotes from 7TV, BTTV and FFZ' },
] satisfies { icon: SymbolViewProps['name']; label: string }[];

export function AuthSheetScreen() {
  const { isPromptingAuth, isSignInReady, startSignIn } = useTwitchSignIn({
    onSuccess: handleAuthSuccess,
  });

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.sheetHeader}>
        <Button label='Cancel' onPress={handleDismiss} hitSlop={10}>
          <Text type='body' color='accent'>
            Cancel
          </Text>
        </Button>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
            source={require('../../../assets/app-icon/app-icon-production.png')}
            style={styles.appIcon}
            contentFit='cover'
          />
          <Text type='title2' align='center'>
            Sign in with Twitch
          </Text>
          <Text type='subhead' color='gray.textLow' align='center'>
            See the channels you follow and chat as yourself.
          </Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map(benefit => (
            <View key={benefit.label} style={styles.benefit}>
              <SymbolView
                name={benefit.icon}
                size={18}
                tintColor={theme.color.textSecondary.dark}
              />
              <Text type='callout'>{benefit.label}</Text>
            </View>
          ))}
        </View>

        <ActionButton
          title='Continue with Twitch'
          variant='brand'
          haptic='light'
          loading={isPromptingAuth}
          disabled={!isSignInReady}
          onPress={() => void startSignIn()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appIcon: {
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    height: 64,
    marginBottom: theme.space8,
    width: 64,
  },
  benefit: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
  },
  benefits: {
    alignSelf: 'center',
    gap: theme.space12,
  },
  container: {
    backgroundColor: theme.color.surface.dark,
  },
  content: {
    alignSelf: 'center',
    gap: theme.space28,
    maxWidth: 520,
    // Clears the sheet's rounded bottom corners, which are wider than the
    // home indicator inset.
    paddingBottom: theme.space36,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space8,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    gap: theme.space8,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
  },
});
