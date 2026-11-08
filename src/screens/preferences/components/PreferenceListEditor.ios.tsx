import { StyleSheet } from 'react-native';

import {
  Button,
  Host,
  HStack,
  Image as NativeImage,
  List,
  Section,
  Spacer,
  Text as SwiftText,
  TextField,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  buttonStyle,
  foregroundStyle,
  listStyle,
  onSubmit,
  submitLabel,
  textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers';

import { theme } from '@app/styles/themes';

import { usePreferenceListEditor } from '../hooks/use-preference-list-editor';
import { formatPreferenceListFooter } from '../util/preferenceList';
import type { PreferenceListEditorProps } from '../util/preferenceListTypes';

const TERM_INPUT_MODIFIERS = [
  autocorrectionDisabled(true),
  textInputAutocapitalization('never'),
];

const SENTENCE_INPUT_MODIFIERS = [textInputAutocapitalization('sentences')];

function NativeItemContent({
  text,
  color,
}: {
  text: string;
  color: string | undefined;
}) {
  return (
    <HStack spacing={theme.space12}>
      {color ? (
        <NativeImage systemName='circle.fill' color={color} size={12} />
      ) : null}
      <SwiftText modifiers={[foregroundStyle(theme.color.text.dark)]}>
        {text}
      </SwiftText>
      <Spacer />
    </HStack>
  );
}

export function PreferenceListEditor<Item>(
  props: PreferenceListEditorProps<Item>,
) {
  const { items, getId, getText, getColor, copy, inputKind, colorPicker } =
    props;

  const inputText = useNativeState('');

  const { save, startEditing, confirmRemove } = usePreferenceListEditor(props);

  const clearInput = () => {
    inputText.value = '';
  };

  const handleSubmit = () => {
    if (save(inputText.value) !== 'empty') {
      clearInput();
    }
  };

  const handleDeleteByIndex = (indices: number[]) => {
    const targets = indices.flatMap(index => {
      const item = items[index];
      return item === undefined ? [] : [item];
    });

    confirmRemove(targets, clearInput);
  };

  return (
    <Host style={styles.screen} colorScheme='dark'>
      <List modifiers={[listStyle('insetGrouped')]}>
        <Section>
          <TextField
            text={inputText}
            placeholder={copy.placeholder}
            modifiers={[
              ...(inputKind === 'term'
                ? TERM_INPUT_MODIFIERS
                : SENTENCE_INPUT_MODIFIERS),
              submitLabel('done'),
              onSubmit(handleSubmit),
            ]}
          />
          {colorPicker ? (
            <HStack spacing={theme.space12}>
              {colorPicker.colors.map(color => (
                <NativeImage
                  key={color}
                  systemName={
                    color === colorPicker.selected
                      ? 'checkmark.circle.fill'
                      : 'circle.fill'
                  }
                  color={color}
                  size={28}
                  onPress={() => colorPicker.onSelect(color)}
                />
              ))}
              <Spacer />
            </HStack>
          ) : null}
        </Section>
        {items.length > 0 ? (
          <Section
            footer={
              <SwiftText>
                {formatPreferenceListFooter(items.length, copy)}
              </SwiftText>
            }
          >
            <List.ForEach onDelete={handleDeleteByIndex}>
              {items.map(item =>
                startEditing ? (
                  <Button
                    key={getId(item)}
                    onPress={() => {
                      startEditing(item);
                      inputText.value = getText(item);
                    }}
                    modifiers={[buttonStyle('plain')]}
                  >
                    <NativeItemContent
                      text={getText(item)}
                      color={getColor?.(item)}
                    />
                  </Button>
                ) : (
                  <NativeItemContent
                    key={getId(item)}
                    text={getText(item)}
                    color={getColor?.(item)}
                  />
                ),
              )}
            </List.ForEach>
          </Section>
        ) : (
          <Section title={copy.emptyTitle}>
            <SwiftText
              modifiers={[foregroundStyle(theme.color.textSecondary.dark)]}
            >
              {copy.emptySubtitle}
            </SwiftText>
          </Section>
        )}
      </List>
    </Host>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});
