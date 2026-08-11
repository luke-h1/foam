import { memo, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Input } from '@app/components/ui/Input/Input';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { theme } from '@app/styles/themes';

interface ChatSearchFieldProps {
  onClose: () => void;
  onQueryChange: (query: string) => void;
}

/**
 * Its own component so that closing search unmounts it. The query lives on a
 * per-channel observable the root Chat component subscribes to, so writing
 * every keystroke straight through would re-render the tree and re-filter the
 * whole message window per character; the field keeps a local draft and lets
 * the store catch up.
 *
 * Unmounting is what makes that safe: it discards the draft and cancels any
 * pending write, which would otherwise land after the user closed search and
 * silently re-apply the filter.
 */
export const ChatSearchField = memo(
  ({ onClose, onQueryChange }: ChatSearchFieldProps) => {
    const [draftQuery, setDraftQuery] = useState('');
    const [pushQuery] = useDebouncedCallback((value: string) => {
      onQueryChange(value);
    }, 150);

    const handleQueryChange = (value: string) => {
      setDraftQuery(value);
      void pushQuery(value);
    };

    return (
      <View style={styles.searchField}>
        <SymbolView
          name='magnifyingglass'
          size={14}
          tintColor={theme.colorGreyHoverAlpha}
        />
        {Platform.OS === 'ios' ? (
          <Input
            accessibilityLabel='Search messages'
            autoCapitalize='none'
            autoComplete='off'
            autoCorrect={false}
            color='white'
            onChangeText={handleQueryChange}
            placeholder='Search messages'
            placeholderTextColor={theme.color.textSecondary.dark}
            radius='none'
            returnKeyType='search'
            size='sm'
            style={{
              backgroundColor: 'transparent',
              flex: 1,
              fontSize: theme.fontSize14,
            }}
            value={draftQuery}
            variant='soft'
          />
        ) : (
          <TextInput
            accessibilityLabel='Search messages'
            autoCapitalize='none'
            autoCorrect={false}
            cursorColor={theme.color.text.dark}
            onChangeText={handleQueryChange}
            placeholder='Search messages'
            placeholderTextColor={theme.color.textSecondary.dark}
            returnKeyType='search'
            selectionColor={theme.colorTextSelection}
            selectionHandleColor={theme.colorPrimary}
            style={styles.searchInput}
            underlineColorAndroid='transparent'
            value={draftQuery}
          />
        )}
        <Button
          accessibilityLabel='Close search'
          accessibilityRole='button'
          onPress={onClose}
        >
          <SymbolView
            name='xmark'
            size={14}
            tintColor={theme.colorGreyHoverAlpha}
          />
        </Button>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  searchField: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space12,
  },
  searchInput: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize14,
    height: 36,
    paddingVertical: 0,
  },
});
