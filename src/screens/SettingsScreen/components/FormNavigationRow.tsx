// "shape" here is @expo/ui API naming (clipShape, contentShape), not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import {
  Button,
  HStack,
  Image,
  Label,
  Spacer,
  Text as NativeText,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  foregroundStyle,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'sf-symbols-typescript';

import { theme } from '@app/styles/themes';

interface FormNavigationRowProps {
  label: string;
  systemImage: SFSymbol;
  onPress: () => void;
}

export function FormNavigationRow({
  label,
  systemImage,
  onPress,
}: FormNavigationRowProps) {
  return (
    <Button onPress={onPress} modifiers={[buttonStyle('plain')]}>
      <HStack modifiers={[contentShape(shapes.rectangle())]}>
        <Label systemImage={systemImage}>
          <NativeText modifiers={[foregroundStyle(theme.color.text.dark)]}>
            {label}
          </NativeText>
        </Label>
        <Spacer />
        <Image
          systemName='chevron.right'
          size={13}
          color={theme.color.textSecondary.dark}
        />
      </HStack>
    </Button>
  );
}
