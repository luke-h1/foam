import {
  MenuView,
  type MenuAction,
  type NativeActionEvent,
} from '@expo/ui/community/menu';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

interface ChatAssetContextMenuProps {
  actions: MenuAction[];
  children: ReactNode;
  onPressAction: (actionId: string) => void;
  preview?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ChatAssetContextMenu({
  actions,
  children,
  onPressAction,
  preview: _preview,
  style,
  testID,
}: ChatAssetContextMenuProps) {
  if (actions.length === 0) {
    return (
      <View style={style} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <MenuView
      actions={actions}
      onPressAction={(event: NativeActionEvent) => {
        onPressAction(event.nativeEvent.event);
      }}
      shouldOpenOnLongPress
      style={style}
      testID={testID}
    >
      {children}
    </MenuView>
  );
}
