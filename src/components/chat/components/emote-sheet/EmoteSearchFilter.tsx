import { View } from 'react-native';

import { Button } from '@app/components/button/Button';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { Input } from '@app/components/ui/input/Input';
import { theme } from '@app/styles/themes';

import { emoteSheetStyles as styles } from './EmoteSheet.styles';

interface EmoteSearchFilterProps {
  onChange?: (value: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  rightOnPress?: () => void;
  value?: string;
}

export function EmoteSearchFilter({
  onChange,
  onSubmitEditing,
  placeholder,
  rightOnPress,
  value,
}: EmoteSearchFilterProps) {
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
        placeholderTextColor='rgba(255,255,255,0.42)'
        radius='none'
        returnKeyType='search'
        size='sm'
        variant='soft'
        {...{
          onChangeText: onChange,
          onSubmitEditing,
          placeholder,
          style: styles.searchInput,
          value,
        }}
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
