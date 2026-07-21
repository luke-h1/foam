import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useTwitchSignIn } from '@app/hooks/useTwitchSignIn';
import { impact } from '@app/lib/haptics';
import { theme } from '@app/styles/themes';

function handleAuthSuccess() {
  if (router.canDismiss()) {
    router.dismiss();
    return;
  }

  router.replace('/tabs/following');
}

export function AuthSheetScreen() {
  const { t } = useTranslation('auth');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const { isPromptingAuth, isSignInReady, startSignIn } = useTwitchSignIn({
    onSuccess: handleAuthSuccess,
  });
  const isDisabled = !isSignInReady || isPromptingAuth;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View
            style={[
              styles.appIconFrame,
              {
                backgroundColor: theme.color.surfaceAlpha[scheme],
                borderColor: theme.color.border[scheme],
              },
            ]}
          >
            <Image
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
              source={require('../../assets/app-icon/app-icon-production.png')}
              style={styles.appIcon}
              contentFit='cover'
            />
          </View>
          <View style={styles.headerCopy}>
            <Text
              type='xxs'
              weight='bold'
              style={[
                styles.eyebrow,
                { color: theme.color.textSecondary[scheme] },
              ]}
            >
              {t('eyebrow')}
            </Text>
            <Text
              type='3xl'
              weight='bold'
              color='gray.text'
              style={styles.title}
            >
              {t('title')}
            </Text>
            <Text
              type='sm'
              color='gray.textLow'
              style={{ color: theme.color.textSecondary[scheme] }}
            >
              {t('subtitle')}
            </Text>
          </View>
        </View>

        <Button
          accessibilityRole='button'
          label={t('continueWithTwitch')}
          onPress={() => {
            void impact('light');
            void startSignIn();
          }}
          disabled={isDisabled}
          style={[
            styles.loginButton,
            isDisabled && styles.loginButtonDisabled,
            isDisabled && {
              backgroundColor: theme.color.backgroundSecondary[scheme],
              borderColor: theme.color.border[scheme],
            },
          ]}
        >
          <LinearGradient
            colors={
              isDisabled
                ? [
                    theme.color.backgroundElement[scheme],
                    theme.color.backgroundElement[scheme],
                  ]
                : [theme.color.brand.twitchLight, theme.color.brand.twitch]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <View style={styles.buttonIcon}>
              <SymbolView
                name='play.tv.fill'
                size={20}
                tintColor={theme.colorWhite}
              />
            </View>
            <Text type='sm' color='gray.text' weight='bold'>
              {isPromptingAuth ? t('openingTwitch') : t('continueWithTwitch')}
            </Text>
          </LinearGradient>
        </Button>

        <View
          style={[
            styles.featureList,
            {
              backgroundColor: theme.color.surfaceAlpha[scheme],
              borderColor: theme.color.border[scheme],
            },
          ]}
        >
          <FeatureItem icon='message' label={t('featureChat')} />
          <FeatureItem icon='star' label={t('featureEmotes')} />
          <FeatureItem icon='person.2' label={t('featureUi')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  label,
}: {
  icon: SymbolViewProps['name'];
  label: string;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View style={styles.featureItem}>
      <View
        style={[
          styles.featureIcon,
          { backgroundColor: theme.color.surfaceAlpha[scheme] },
        ]}
      >
        <SymbolView
          name={icon}
          size={15}
          tintColor={theme.color.textSecondary[scheme]}
        />
      </View>
      <Text
        type='xs'
        color='gray.textLow'
        weight='medium'
        style={styles.featureText}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appIcon: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 58,
    width: 58,
  },
  appIconFrame: {
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    boxShadow: '0px 16px 36px rgba(145, 70, 255, 0.24)',
    padding: theme.space4,
  },
  buttonGradient: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    flexDirection: 'row',
    gap: theme.space12,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: theme.space20,
    width: '100%',
  },
  buttonIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: theme.borderRadius999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  container: {
    flex: 1,
  },
  eyebrow: {
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  featureIcon: {
    alignItems: 'center',
    borderRadius: theme.borderRadius999,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  featureItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 32,
  },
  featureList: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    gap: theme.space8,
    padding: theme.space12,
  },
  featureText: {
    flex: 1,
  },
  header: {
    gap: theme.space16,
  },
  headerCopy: {
    gap: theme.space8,
  },
  loginButton: {
    backgroundColor: theme.color.brand.twitch,
    borderColor: theme.color.brand.twitchBorder,
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    boxShadow: '0px 18px 40px rgba(145, 70, 255, 0.28)',
    overflow: 'hidden',
    width: '100%',
  },
  loginButtonDisabled: {
    boxShadow: 'none',
    opacity: 0.64,
  },
  content: {
    alignSelf: 'center',
    gap: theme.space20,
    justifyContent: 'center',
    maxWidth: 520,
    minHeight: '100%',
    paddingBottom: theme.space20,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space24,
    width: '100%',
  },
  title: {
    letterSpacing: 0,
  },
});
