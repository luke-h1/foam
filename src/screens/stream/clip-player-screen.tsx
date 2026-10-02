import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { ActionButton } from '@app/components/action-button/action-button';
import { StreamPlayer } from '@app/components/stream-player/stream-player';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { theme } from '@app/styles/themes';
import { shareDeepLink } from '@app/utils/sharing/share-deep-link';

interface ClipPlayerScreenProps {
  id: string;
}

/**
 * The sheet sizes to its content: the clip at 16:9 with its actions below,
 * so no controls sit on top of the video and there is no letterboxing.
 */
export function ClipPlayerScreen({ id }: ClipPlayerScreenProps) {
  const insets = useSafeAreaInsets();

  // The sheet sizes to its content, and EmptyState fills its parent with
  // `flex: 1`. A fixed height stops it measuring as zero.
  if (!id) {
    return (
      <View style={styles.notFound}>
        <EmptyState
          iconName='scissors'
          heading='Clip not found'
          content='This link does not point to a clip.'
          button='Close'
          buttonOnPress={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, theme.space16) },
      ]}
    >
      <View style={styles.player}>
        <StreamPlayer
          clip={id}
          autoplay
          muted={false}
          height='100%'
          width='100%'
        />
      </View>

      <View style={styles.actions}>
        <ActionButton
          title='Share'
          icon='square.and.arrow.up'
          variant='secondary'
          style={styles.action}
          onPress={() => {
            void shareDeepLink({ kind: 'clip', id });
          }}
        />
        <ActionButton
          title='Done'
          variant='secondary'
          style={styles.action}
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space16,
  },
  container: {
    backgroundColor: theme.color.surface.dark,
    paddingTop: theme.space28,
  },
  notFound: {
    height: 320,
  },
  player: {
    aspectRatio: 16 / 9,
    backgroundColor: theme.colorBlack,
    width: '100%',
  },
});
