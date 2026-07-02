import { ActivityIndicator } from 'react-native';

import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { resolveSpacingValue, Spacing } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';

type IconType =
  | {
      color?: string;
      name: SymbolViewProps['name'];
      size?: number;
      type: 'symbol';
    }
  | SymbolViewProps['name'];

export function IconButtonIcon({
  icon,
  loading,
  size = 'md',
}: {
  icon: IconType;
  loading?: boolean;
  size?: Spacing;
}) {
  if (loading) {
    return <ActivityIndicator color={theme.color.text.dark} />;
  }

  if (typeof icon === 'string' || !('type' in icon)) {
    return (
      <SymbolView
        name={icon}
        size={resolveSpacingValue(theme, size)}
        tintColor={theme.colorGrey}
      />
    );
  }

  if (icon.type === 'symbol') {
    return (
      <SymbolView
        name={icon.name}
        size={icon.size ?? resolveSpacingValue(theme, size)}
        tintColor={icon.color ?? theme.colorGrey}
      />
    );
  }

  return null;
}
