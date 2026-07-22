import { useSyncExternalStore } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Column,
  Host,
  LazyColumn,
  ListItem,
  ModalBottomSheet,
  RNHostView,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  fillMaxWidth,
  height,
  padding,
  paddingAll,
} from '@expo/ui/jetpack-compose/modifiers';
import { Image } from 'expo-image';

import { theme } from '@app/styles/themes';
import type {
  ChangelogListItem,
  ChangelogMediaItem,
  ChangelogVersionNotes,
} from '@modules/changelog/src/Changelog.types';
import {
  dismissChangelogAndroid,
  getChangelogAndroidState,
  subscribeChangelogAndroid,
} from '@modules/changelog/src/changelogAndroidPresenter';

function ListNotes({ item }: { item: ChangelogListItem }) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <Column
      modifiers={[fillMaxWidth(), paddingAll(4)]}
      verticalArrangement={{ spacedBy: 8 }}
    >
      <Text
        color={theme.color.text[scheme]}
        style={{ typography: 'titleLarge', fontWeight: '700' }}
      >
        {item.title}
      </Text>
      {item.rows.map(row => (
        <ListItem
          key={`${row.title}-${row.description}`}
          colors={{
            containerColor: theme.color.menu.cardActive[scheme],
            contentColor: theme.color.text[scheme],
            supportingContentColor: theme.color.textSecondary[scheme],
          }}
        >
          <ListItem.HeadlineContent>
            <Text
              color={theme.color.text[scheme]}
              style={{ typography: 'titleMedium', fontWeight: '600' }}
            >
              {row.title}
            </Text>
          </ListItem.HeadlineContent>
          <ListItem.SupportingContent>
            <Text
              color={theme.color.textSecondary[scheme]}
              style={{ typography: 'bodyMedium' }}
            >
              {row.description}
            </Text>
          </ListItem.SupportingContent>
        </ListItem>
      ))}
    </Column>
  );
}

function MediaNotes({ item }: { item: ChangelogMediaItem }) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <Column
      modifiers={[fillMaxWidth(), paddingAll(4)]}
      verticalArrangement={{ spacedBy: 8 }}
    >
      {item.mediaKind === 'image' ? (
        <RNHostView matchContents modifiers={[fillMaxWidth(), height(180)]}>
          <View style={styles.mediaFrame}>
            <Image
              source={{ uri: item.url }}
              style={styles.mediaImage}
              contentFit='cover'
            />
          </View>
        </RNHostView>
      ) : null}
      <Text
        color={theme.color.text[scheme]}
        style={{ typography: 'titleLarge', fontWeight: '700' }}
      >
        {item.title}
      </Text>
      <Text
        color={theme.color.textSecondary[scheme]}
        style={{ typography: 'bodyMedium' }}
      >
        {item.description}
      </Text>
    </Column>
  );
}

function VersionNotes({ notes }: { notes: ChangelogVersionNotes }) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <Column modifiers={[fillMaxWidth()]} verticalArrangement={{ spacedBy: 12 }}>
      <Text
        color={theme.color.textSecondary[scheme]}
        style={{ typography: 'labelLarge', fontWeight: '600' }}
      >
        {notes.version}
      </Text>
      {notes.items.map(item =>
        item.type === 'list' ? (
          <ListNotes key={`list-${notes.version}-${item.title}`} item={item} />
        ) : (
          <MediaNotes
            key={`media-${notes.version}-${item.title}`}
            item={item}
          />
        ),
      )}
    </Column>
  );
}

export function ChangelogAndroidHost() {
  const { t } = useTranslation('common');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const options = useSyncExternalStore(
    subscribeChangelogAndroid,
    getChangelogAndroidState,
    getChangelogAndroidState,
  );

  if (!options) {
    return null;
  }

  const doneLabel = options.configuration?.doneButtonLabel ?? t('done');

  return (
    <Host colorScheme={scheme} style={styles.host} pointerEvents='box-none'>
      <ModalBottomSheet
        containerColor={theme.color.menu.background[scheme]}
        contentColor={theme.color.text[scheme]}
        onDismissRequest={dismissChangelogAndroid}
        showDragHandle
      >
        <Column
          modifiers={[fillMaxWidth(), padding(16, 8, 16, 24)]}
          verticalArrangement={{ spacedBy: 12 }}
        >
          <LazyColumn
            contentPadding={{ start: 0, top: 0, end: 0, bottom: 8 }}
            horizontalAlignment='start'
            modifiers={[fillMaxWidth(), height(420)]}
            verticalArrangement={{ spacedBy: 20 }}
          >
            {options.notes.map(notes => (
              <VersionNotes key={notes.version} notes={notes} />
            ))}
          </LazyColumn>
          <Button
            colors={{
              containerColor: theme.color.menu.cardActive[scheme],
              contentColor: theme.color.text[scheme],
            }}
            modifiers={[fillMaxWidth()]}
            onClick={dismissChangelogAndroid}
          >
            <Text
              color={theme.color.text[scheme]}
              style={{ typography: 'titleMedium', fontWeight: '600' }}
            >
              {doneLabel}
            </Text>
          </Button>
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
  },
  mediaFrame: {
    borderCurve: 'continuous',
    borderRadius: 16,
    height: 180,
    overflow: 'hidden',
    width: '100%',
  },
  mediaImage: {
    height: '100%',
    width: '100%',
  },
});
