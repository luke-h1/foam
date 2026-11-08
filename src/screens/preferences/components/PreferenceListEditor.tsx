import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { PressableScale } from 'pressto';

import type {
  FlashListRef,
  ListRenderItem,
} from '@app/components/flash-list/FlashList';
import { FlashList } from '@app/components/flash-list/FlashList';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { theme } from '@app/styles/themes';

import { usePreferenceListEditor } from '../hooks/use-preference-list-editor';
import { formatPreferenceListFooter } from '../util/preferenceList';
import type {
  PreferenceListColorPicker,
  PreferenceListCopy,
  PreferenceListEditorProps,
} from '../util/preferenceListTypes';

function PreferenceListEmptyState({ copy }: { copy: PreferenceListCopy }) {
  return (
    <View style={styles.emptyState}>
      <SymbolView
        name={copy.emptyIcon}
        size={48}
        tintColor={theme.color.textSecondary.dark}
      />
      <Text type='title3' weight='medium' style={styles.emptyTitle}>
        {copy.emptyTitle}
      </Text>
      <Text type='body' style={styles.emptySubtitle}>
        {copy.emptySubtitle}
      </Text>
    </View>
  );
}

interface PreferenceListInputProps {
  value: string;
  placeholder: string;
  inputKind: PreferenceListEditorProps<unknown>['inputKind'];
  isEditing: boolean;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  colorPicker: PreferenceListColorPicker | undefined;
}

function PreferenceListInput({
  value,
  placeholder,
  inputKind,
  isEditing,
  onChangeText,
  onSubmit,
  colorPicker,
}: PreferenceListInputProps) {
  const canSubmit = value.trim().length > 0;

  return (
    <View style={styles.inputSection}>
      <View style={styles.inputRow}>
        <TextInput
          autoCapitalize={inputKind === 'term' ? 'none' : 'sentences'}
          autoCorrect={inputKind === 'sentence'}
          placeholder={placeholder}
          placeholderTextColor={theme.color.textFaint.dark}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType='done'
          style={styles.input}
        />
        <PressableScale
          {...(canSubmit ? { onPress: onSubmit } : {})}
          style={[styles.addButton, canSubmit ? styles.addButtonEnabled : null]}
        >
          <SymbolView
            name={isEditing ? 'checkmark' : 'plus'}
            size={16}
            tintColor={
              canSubmit ? theme.colorBlack : theme.color.textFaint.dark
            }
          />
        </PressableScale>
      </View>
      {colorPicker ? (
        <View style={styles.swatchRow}>
          {colorPicker.colors.map(color => (
            <PressableScale
              key={color}
              onPress={() => colorPicker.onSelect(color)}
              hitSlop={6}
              style={[
                styles.swatch,
                { backgroundColor: color },
                color === colorPicker.selected && styles.swatchSelected,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

interface PreferenceListRowProps {
  text: string;
  color: string | undefined;
  isEditing: boolean;
  removeLabel: string;
  onPress: (() => void) | undefined;
  onRemove: () => void;
}

function PreferenceListRow({
  text,
  color,
  isEditing,
  removeLabel,
  onPress,
  onRemove,
}: PreferenceListRowProps) {
  return (
    <PressableScale
      {...(onPress ? { onPress } : {})}
      style={[styles.row, isEditing && styles.rowEditing]}
    >
      {color ? (
        <View style={[styles.colorDot, { backgroundColor: color }]} />
      ) : null}
      <Text type='headline' style={styles.itemText} numberOfLines={2}>
        {text}
      </Text>
      <PressableScale
        accessibilityLabel={removeLabel}
        accessibilityRole='button'
        onPress={onRemove}
        hitSlop={11}
      >
        <SymbolView
          name='minus.circle.fill'
          size={22}
          tintColor={theme.color.textSecondary.dark}
        />
      </PressableScale>
    </PressableScale>
  );
}

export function PreferenceListEditor<Item>(
  props: PreferenceListEditorProps<Item>,
) {
  const { items, getId, getText, getColor, copy, inputKind, colorPicker } =
    props;

  const [inputValue, setInputValue] = useState('');
  const listRef = useRef<FlashListRef<Item>>(null);

  const { editingId, save, startEditing, confirmRemove } =
    usePreferenceListEditor(props);

  useScrollToTop(listRef);

  const handleSubmit = () => {
    if (save(inputValue) !== 'empty') {
      setInputValue('');
    }
  };

  const clearInput = () => setInputValue('');

  const renderItem: ListRenderItem<Item> = ({ item }) => (
    <PreferenceListRow
      text={getText(item)}
      color={getColor?.(item)}
      isEditing={getId(item) === editingId}
      removeLabel={copy.removeTitle}
      onPress={
        startEditing
          ? () => {
              startEditing(item);
              setInputValue(getText(item));
            }
          : undefined
      }
      onRemove={() => confirmRemove([item], clearInput)}
    />
  );

  const hasItems = items.length > 0;

  return (
    <KeyboardAvoidingView behavior='padding' style={styles.screen}>
      <FlashList
        ref={listRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={getId}
        extraData={editingId}
        contentInsetAdjustmentBehavior='automatic'
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={[
          styles.listContent,
          !hasItems && styles.listContentEmpty,
        ]}
        ListHeaderComponent={
          <PreferenceListInput
            value={inputValue}
            placeholder={copy.placeholder}
            inputKind={inputKind}
            isEditing={editingId !== null}
            onChangeText={setInputValue}
            onSubmit={handleSubmit}
            colorPicker={colorPicker}
          />
        }
        ListEmptyComponent={<PreferenceListEmptyState copy={copy} />}
        ListFooterComponent={
          hasItems ? (
            <Text type='subhead' style={styles.footer}>
              {formatPreferenceListFooter(items.length, copy)}
            </Text>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.color.surfacePressed.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  addButtonEnabled: {
    backgroundColor: theme.colorWhite,
  },
  colorDot: {
    borderRadius: theme.radius.sm,
    height: 12,
    width: 12,
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.space12,
    justifyContent: 'center',
    minHeight: 280,
    paddingHorizontal: 40,
  },
  emptySubtitle: {
    color: theme.color.textSecondary.dark,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: theme.color.text.dark,
    marginTop: theme.space4,
  },
  footer: {
    color: theme.color.textSecondary.dark,
    lineHeight: 18,
    paddingHorizontal: theme.space4,
    paddingTop: theme.space16,
  },
  input: {
    backgroundColor: theme.color.surface.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colorWhite,
    flex: 1,
    fontSize: theme.fontSize16,
    height: 44,
    paddingHorizontal: theme.space16,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
  },
  inputSection: {
    gap: theme.space12,
    paddingBottom: theme.space16,
    paddingTop: theme.space12,
  },
  itemText: {
    color: theme.colorWhite,
    flex: 1,
    fontSize: theme.fontSize14,
    lineHeight: 20,
    minWidth: 0,
  },
  listContent: {
    paddingBottom: theme.space24,
    paddingHorizontal: theme.space16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space4,
    paddingVertical: 14,
  },
  rowEditing: {
    backgroundColor: theme.color.surface.dark,
  },
  screen: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  swatch: {
    borderColor: 'transparent',
    borderRadius: theme.radius.full,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  swatchSelected: {
    borderColor: theme.colorWhite,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: theme.space8,
  },
});
