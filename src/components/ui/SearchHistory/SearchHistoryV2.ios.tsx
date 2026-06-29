import { useCallback } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

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
const PRIMARY = theme.color.text.dark;
const ROW_BACKGROUND = theme.color.background.dark;

// The list sits below the suggested chips and does not scroll; cap it so the
// rows never run off-screen behind the floating search bar.
const MAX_VISIBLE = 8;

export function SearchHistoryV2({
  history,
  onClearAll,
  onClearItem,
  onSelectItem,
}: SearchHistoryV2Props) {
  const { t } = useTranslation(['search', 'common']);

  const handleClearAll = useCallback(() => {
    Alert.alert(t('clearSearchHistory'), t('clearSearchHistoryConfirm'), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('common:clearAll'), style: 'destructive', onPress: onClearAll },
    ]);
  }, [onClearAll, t]);

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
                {t('recentSearches')}
              </Text>
              <Spacer />
              <Button onPress={handleClearAll}>
                <Text
                  modifiers={[
                    font({ textStyle: 'footnote' }),
                    foregroundStyle(theme.colorRed),
                  ]}
                >
                  {t('common:clearAll')}
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
                  listRowBackground(ROW_BACKGROUND),
                ]}
              >
                <HStack spacing={12}>
                  <Image systemName='clock' size={16} color={SECONDARY} />
                  <Text modifiers={[foregroundStyle(PRIMARY)]}>{query}</Text>
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
