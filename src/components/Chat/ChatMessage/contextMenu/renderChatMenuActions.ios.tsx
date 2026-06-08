import type { ReactNode } from 'react';
import type { MenuAction, NativeActionEvent } from '@expo/ui/community/menu';
import { Button, Menu, Section, Toggle } from '@expo/ui/swift-ui';
import {
  disabled as disabledModifier,
  foregroundColor as foregroundColorModifier,
  ModifierConfig,
  tint as tintModifier,
} from '@expo/ui/swift-ui/modifiers';

function actionId(action: MenuAction): string {
  return action.id ?? action.title;
}

function makeEvent(action: MenuAction): NativeActionEvent {
  return { nativeEvent: { event: actionId(action) } };
}

function renderAction(
  action: MenuAction,
  onPressAction: (event: NativeActionEvent) => void,
): ReactNode {
  if (action.attributes?.hidden) {
    return null;
  }

  const {
    subactions,
    displayInline,
    state,
    attributes,
    image,
    imageColor,
    title,
  } = action;
  const key = actionId(action);
  const systemImage = typeof image === 'string' ? image : undefined;
  const tintMod = imageColor ? tintModifier(imageColor) : null;

  if (subactions && subactions.length > 0) {
    const children = subactions.map(sub => renderAction(sub, onPressAction));
    if (displayInline) {
      return (
        <Section key={key} title={title}>
          {children}
        </Section>
      );
    }

    return (
      <Menu key={key} label={title} systemImage={systemImage}>
        {children}
      </Menu>
    );
  }

  const fire = () => onPressAction(makeEvent(action));

  const modifiers: ModifierConfig[] = [];
  if (attributes?.disabled) {
    modifiers.push(disabledModifier(true));
  }

  if (state === 'on' || state === 'off') {
    if (tintMod) {
      modifiers.push(tintMod);
    }
    return (
      <Toggle
        key={key}
        label={title}
        systemImage={systemImage}
        isOn={state === 'on'}
        onIsOnChange={fire}
        modifiers={modifiers.length > 0 ? modifiers : undefined}
      />
    );
  }

  if (imageColor && !attributes?.destructive) {
    modifiers.push(foregroundColorModifier(imageColor));
  }

  return (
    <Button
      key={key}
      label={title}
      systemImage={systemImage}
      role={attributes?.destructive ? 'destructive' : undefined}
      modifiers={modifiers.length > 0 ? modifiers : undefined}
      onPress={fire}
    />
  );
}

export function ChatMenuActions({
  actions,
  onPressAction,
  title,
}: {
  actions: MenuAction[];
  onPressAction: (event: NativeActionEvent) => void;
  title?: string;
}) {
  const items = actions.map(action => renderAction(action, onPressAction));

  if (title) {
    return <Section title={title}>{items}</Section>;
  }

  return <>{items}</>;
}
