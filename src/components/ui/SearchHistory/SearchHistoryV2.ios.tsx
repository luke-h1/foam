import { useCallback } from 'react';
import { Alert, StyleSheet } from 'react-native';

import {
  Button,
  Host,
  HStack,
  Image,
  List,
  Section,
  Spacer,
  Text,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  font,
  foregroundStyle,
  listRowBackground,
  listStyle,
  scrollContentBackground,
  scrollDisabled,
} from '@expo/ui/swift-ui/modifiers';

import { theme } from '@app/styles/themes';

interface SearchHistoryV2Props {
  history: string[];
  onClearItem: (id: string) => void;
  onSelectItem: (query: string) => void;
  onClearAll: () => void;
}

const SECONDARY = theme.color.textSecondary.dark;

// The list sits below the suggested chips and does not scroll; cap it so the
// rows never run off-screen behind the floating search bar.
const MAX_VISIBLE = 8;

export function SearchHistoryV2({
  history,
  onClearAll,
  onClearItem,
  onSelectItem,
}: SearchHistoryV2Props) {
  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear Search History',
      'Are you sure you want to clear all your recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: onClearAll },
      ],
    );
  }, [onClearAll]);

  const handleDelete = useCallback(
    (indices: number[]) => {
      for (const index of indices) {
        const query = history[index];
        if (query) {
          onClearItem(query);
        }
      }
    },
    [history, onClearItem],
  );

  if (history.length === 0) {
    return null;
  }

  return (
    <Host style={styles.host} colorScheme='dark' testID='search-history'>
      <List
        modifiers={[
          listStyle('plain'),
          scrollDisabled(true),
          scrollContentBackground('hidden'),
        ]}
      >
        <Section
          header={
            <HStack>
              <Text
                modifiers={[
                  font({ textStyle: 'footnote', weight: 'semibold' }),
                  foregroundStyle(SECONDARY),
                ]}
              >
                RECENT SEARCHES
              </Text>
              <Spacer />
              <Button onPress={handleClearAll}>
                <Text
                  modifiers={[
                    font({ textStyle: 'footnote' }),
                    foregroundStyle(theme.colorRed),
                  ]}
                >
                  Clear All
                </Text>
              </Button>
            </HStack>
          }
        >
          <List.ForEach onDelete={handleDelete}>
            {history.slice(0, MAX_VISIBLE).map(query => (
              <Button
                key={query}
                testID={`search-history-item-${query}`}
                onPress={() => onSelectItem(query)}
                modifiers={[
                  buttonStyle('plain'),
                  listRowBackground(theme.color.background.dark),
                ]}
              >
                <HStack spacing={12}>
                  <Image systemName='clock' size={16} color={SECONDARY} />
                  <Text modifiers={[foregroundStyle(theme.color.text.dark)]}>
                    {query}
                  </Text>
                  <Spacer />
                  <Image
                    systemName='arrow.up.left'
                    size={13}
                    color={SECONDARY}
                  />
                </HStack>
              </Button>
            ))}
          </List.ForEach>
        </Section>
      </List>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});
