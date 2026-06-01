import { IconButton } from '@app/components/IconButton/IconButton';
import { StreamPlayer } from '@app/components/StreamPlayer/StreamPlayer';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { theme } from '@app/styles/themes';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ClipPlayerScreenProps {
  id: string;
}

export function ClipPlayerScreen({ id }: ClipPlayerScreenProps) {
  const insets = useSafeAreaInsets();

  if (!id) {
    return (
      <EmptyState
        heading='Clip not found'
        content='Could not open this clip.'
        button='Close'
        buttonOnPress={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StreamPlayer
        clip={id}
        parent='www.twitch.tv'
        autoplay
        muted={false}
        height='100%'
        width='100%'
      />

      <View
        style={[styles.closeButtonWrap, { top: insets.top + theme.space12 }]}
      >
        <IconButton
          icon={{ type: 'symbol', name: 'xmark', size: 18 }}
          label='Close clip'
          onPress={() => router.back()}
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
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  closeButtonWrap: {
    position: 'absolute',
    right: theme.space16,
    zIndex: 2,
  },
  container: {
    backgroundColor: '#000',
    flex: 1,
  },
});
