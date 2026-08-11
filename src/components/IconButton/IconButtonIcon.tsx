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
  const dimension = resolveSpacingValue(theme, size);

  if (loading) {
    return (
      <ActivityIndicator
        color={theme.colorGrey}
        style={{ height: dimension, width: dimension }}
      />
    );
  }

  if (typeof icon === 'string' || !('type' in icon)) {
    return (
      <SymbolView
        name={icon}
        size={dimension}
        tintColor={theme.colorGrey}
        weight='semibold'
      />
    );
  }

  if (icon.type === 'symbol') {
    return (
      <SymbolView
        name={icon.name}
        size={icon.size ?? dimension}
        tintColor={icon.color ?? theme.colorGrey}
        weight='semibold'
      />
    );
  }

  return null;
}
