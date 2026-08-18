import { ActivityIndicator } from 'react-native';

import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { resolveSpacingValue, Spacing } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';

type IconSymbolDescriptor = {
  color?: string;
  name: SymbolViewProps['name'];
  size?: number;
  type: 'symbol';
};

type IconType = IconSymbolDescriptor | SymbolViewProps['name'];

function isIconSymbolDescriptor(icon: IconType): icon is IconSymbolDescriptor {
  return icon instanceof Object && 'type' in icon;
}

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

  if (isIconSymbolDescriptor(icon)) {
    return (
      <SymbolView
        name={icon.name}
        size={icon.size ?? resolveSpacingValue(theme, size)}
        tintColor={icon.color ?? theme.colorGrey}
      />
    );
  }

  return (
    <SymbolView
      name={icon}
      size={resolveSpacingValue(theme, size)}
      tintColor={theme.colorGrey}
    />
  );
}
