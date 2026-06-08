import { ContextMenu, Host, RNHostView } from '@expo/ui/swift-ui';
import type { MenuAction } from '@expo/ui/community/menu';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { ChatMenuActions } from './renderChatMenuActions.ios';

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
  preview,
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

  const trigger = (
    <RNHostView matchContents>
      <>{children}</>
    </RNHostView>
  );
  const previewContent = preview ? (
    <RNHostView matchContents>
      <View collapsable={false}>{preview}</View>
    </RNHostView>
  ) : null;

  return (
    <Host matchContents={{ vertical: true }} style={style} testID={testID}>
      <ContextMenu>
        <ContextMenu.Trigger>{trigger}</ContextMenu.Trigger>
        {previewContent ? (
          <ContextMenu.Preview>{previewContent}</ContextMenu.Preview>
        ) : null}
        <ContextMenu.Items>
          <ChatMenuActions
            actions={actions}
            onPressAction={event => {
              onPressAction(event.nativeEvent.event);
            }}
          />
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
