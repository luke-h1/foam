import { ActivityIndicator } from 'react-native';

import { SymbolView, type SymbolViewProps } from '@app/components/ui/icon/icon';
import { resolveSpacingValue, type Spacing } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';

type IconSymbolDescriptor = {
  color?: string | undefined;
  name: SymbolViewProps['name'];
  size?: number | undefined;
  type: 'symbol';
};

export type IconType = IconSymbolDescriptor | SymbolViewProps['name'];

function isIconSymbolDescriptor(icon: IconType): icon is IconSymbolDescriptor {
  return icon instanceof Object && 'type' in icon;
}

export function IconButtonIcon({
  icon,
  loading,
  size = 'md',
}: {
  icon: IconType;
  loading?: boolean | undefined;
  size?: Spacing | undefined;
}) {
  const resolvedSize = size ?? 'md';
  const fallbackSize = resolveSpacingValue(theme, resolvedSize);

  if (loading) {
    return <ActivityIndicator color={theme.color.text.dark} />;
  }

  if (isIconSymbolDescriptor(icon)) {
    return (
      <SymbolView
        name={icon.name}
        size={icon.size ?? fallbackSize}
        tintColor={icon.color ?? theme.colorGrey}
      />
    );
  }

  return (
    <SymbolView name={icon} size={fallbackSize} tintColor={theme.colorGrey} />
  );
}
