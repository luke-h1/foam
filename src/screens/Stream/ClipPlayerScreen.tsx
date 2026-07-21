import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { IconButton } from '@app/components/IconButton/IconButton';
import { StreamPlayer } from '@app/components/StreamPlayer/StreamPlayer';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { PlayerBackButton } from '@app/screens/Stream/components/PlayerBackButton';
import { theme } from '@app/styles/themes';
import { shareDeepLink } from '@app/utils/sharing/shareDeepLink';

interface ClipPlayerScreenProps {
  id: string;
}

export function ClipPlayerScreen({ id }: ClipPlayerScreenProps) {
  const { t } = useTranslation(['stream', 'common']);
  const insets = useSafeAreaInsets();

  if (!id) {
    return (
      <EmptyState
        heading={t('clipNotFound')}
        content={t('clipNotFoundDescription')}
        button={t('common:close')}
        buttonOnPress={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StreamPlayer
        clip={id}
        autoplay
        muted={false}
        height='100%'
        width='100%'
      />

      <View
        style={[styles.backButtonWrap, { top: insets.top + theme.space12 }]}
      >
        <PlayerBackButton />
      </View>

      <View
        style={[styles.closeButtonWrap, { top: insets.top + theme.space12 }]}
      >
        <IconButton
          icon={{ type: 'symbol', name: 'square.and.arrow.up', size: 18 }}
          label={t('shareClip')}
          onPress={() => {
            void shareDeepLink({ kind: 'clip', id });
          }}
          size='2xl'
          style={styles.closeButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.color.pressedOverlay.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  backButtonWrap: {
    left: theme.space16,
    position: 'absolute',
    zIndex: 2,
  },
  closeButtonWrap: {
    flexDirection: 'row',
    gap: theme.space12,
    position: 'absolute',
    right: theme.space16,
    zIndex: 2,
  },
  container: {
    backgroundColor: theme.colorBlack,
    flex: 1,
  },
});
