import { Button } from '@app/components/Button/Button';
import { Input } from '@app/components/ui/Input/Input';
import { theme } from '@app/styles/themes';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { View } from 'react-native';
import { emoteSheetStyles as styles } from './emoteSheetStyles';

export function EmoteSearchFilter({
  onChange,
  onSubmitEditing,
  placeholder,
  rightOnPress,
  value,
}: {
  onChange?: (value: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  rightOnPress?: () => void;
  value?: string;
}) {
  const hasValue = Boolean(value && value.length > 0);

  return (
    <View style={styles.searchInputWrap}>
      <SymbolView
        name='magnifyingglass'
        style={styles.searchIcon}
        tintColor={theme.color.textSecondary.dark}
      />
      <Input
        autoCapitalize='none'
        autoComplete='off'
        autoCorrect={false}
        color='white'
        onChangeText={onChange}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor='rgba(255,255,255,0.42)'
        radius='none'
        returnKeyType='search'
        size='sm'
        style={styles.searchInput}
        value={value}
        variant='soft'
      />
      <Button
        onPress={rightOnPress}
        style={[
          styles.searchClearButton,
          !hasValue && styles.searchClearButtonHidden,
        ]}
        disabled={!hasValue}
      >
        <SymbolView name='xmark' tintColor={theme.color.text.dark} />
      </Button>
    </View>
  );
}
