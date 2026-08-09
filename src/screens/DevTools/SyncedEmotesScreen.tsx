import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { ChatInlineImage } from '@app/components/Chat/components/ChatMessage/renderers/ChatInlineImage';
import {
  createRowVisibilityStore,
  RowVisibilityContext,
} from '@app/components/Chat/components/ChatMessage/rowVisibility';
import { Text } from '@app/components/ui/Text/Text';
import { setSharedAnimationEnabled } from '@app/lib/expo-image/setSharedAnimationEnabled';
import { theme } from '@app/styles/themes';

const emoteUrls = [
  // om
  'https://cdn.7tv.app/emote/01GZ577RM8000DE3H3K22S8S7G/4x.avif',
  // LOL
  'https://cdn.7tv.app/emote/01FZ975PV8000B4AWRZNMVNEXN/2x.avif',
];

const copiesPerRow = 5;
const staggerMs = 400;
export const SyncedEmotesScreen = () => {
  const [remount, setRemount] = useState({ generation: 0, staggered: false });
  const [sharedClock, setSharedClock] = useState(true);

  const toggleSharedClock = () => {
    const next = !sharedClock;
    setSharedClock(next);
    setSharedAnimationEnabled(next);
    setRemount(prev => ({ generation: prev.generation + 1, staggered: false }));
  };

  return (
    <ScrollView
      style={styles.screenContainer}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior='automatic'
    >
      <Text style={styles.hint}>
        Deterministic test to test whether the expo image patch actually keeps
        gifs/avif image formats synced frame by frame
      </Text>
      <View style={styles.actions}>
        <Button
          onPress={() =>
            setRemount(prev => ({
              generation: prev.generation + 1,
              staggered: false,
            }))
          }
          style={styles.button}
        >
          <Text style={styles.buttonText}>Remount</Text>
        </Button>
        <Button
          style={styles.button}
          onPress={() =>
            setRemount(prev => ({
              generation: prev.generation + 1,
              staggered: true,
            }))
          }
        >
          <Text style={styles.buttonText}>Staggered Remount</Text>
        </Button>
      </View>
      <View style={styles.actions}>
        <Button onPress={toggleSharedClock} style={styles.button}>
          <Text style={styles.buttonText}>
            Shared clock: {sharedClock ? 'on' : 'off'}
          </Text>
        </Button>
      </View>
      {emoteUrls.map(url => (
        <View key={url} style={styles.row}>
          {Array.from({ length: copiesPerRow }, (_, column) => (
            <SyncedEmoteCell
              key={`${remount.generation}:${column}`}
              mountDelayMs={remount.staggered ? column * staggerMs : 0}
              sourceUrl={url}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

function SyncedEmoteCell({
  mountDelayMs,
  sourceUrl,
}: {
  mountDelayMs: number;
  sourceUrl: string;
}) {
  const [visibility] = useState(createRowVisibilityStore);
  const [mounted, setMounted] = useState(mountDelayMs === 0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (mountDelayMs === 0) {
      return undefined;
    }

    const timer = setTimeout(() => setMounted(true), mountDelayMs);
    return () => clearTimeout(timer);
  }, [mountDelayMs]);

  const handlePress = () => {
    const nextPaused = !paused;
    setPaused(nextPaused);
    visibility.setVisible(!nextPaused);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.cell, paused && styles.cellPaused]}
    >
      {mounted ? (
        <RowVisibilityContext.Provider value={visibility}>
          <ChatInlineImage sourceUrl={sourceUrl} style={styles.emote} />
        </RowVisibilityContext.Provider>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 8,
  },
  buttonText: {
    color: theme.color.text.dark,
    fontSize: 13,
    fontWeight: '500',
  },
  cell: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  cellPaused: {
    borderColor: theme.colorOrange,
    opacity: 0.5,
  },
  content: {
    gap: 12,
    padding: 16,
  },
  emote: {
    height: 40,
    width: 40,
  },
  hint: {
    color: theme.color.textSecondary.dark,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  screenContainer: { backgroundColor: theme.color.background.dark, flex: 1 },
});
