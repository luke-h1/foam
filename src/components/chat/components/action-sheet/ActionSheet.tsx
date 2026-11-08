import { memo } from 'react';
import { ScrollView, View } from 'react-native';

import { ChatSheet } from '@app/components/chat/components/sheet/ChatSheet';
import { chatSheetStyles } from '@app/components/chat/components/sheet/ChatSheet.styles';
import { useChatSheet } from '@app/components/chat/components/sheet/hooks/use-chat-sheet';
import { useChatSheetHeight } from '@app/components/chat/components/sheet/hooks/use-chat-sheet-height';
import { SheetHeader } from '@app/components/chat/components/sheet/SheetHeader';
import {
  type ChatSheetLayout,
  SHEET_CHROME,
} from '@app/components/chat/components/sheet/util/chatSheetLayout';
import {
  type SheetAction,
  SheetActionGroup,
} from '@app/components/chat/components/SheetActionGroup';
import {
  banUserAction,
  blockUserAction,
  timeoutUserAction,
} from '@app/components/chat/util/userSheetActions';
import { theme } from '@app/styles/themes';
import type { MessageToken } from '@app/types/chat/messageToken';

import { MessageActionPreview } from './MessageActionPreview';

interface ActionSheetProps {
  onDismiss: () => void;
  username?: string;
  usernameColor?: string;
  messagePreview?: MessageToken[];
  onReply: () => void;
  onCopy: () => void;
  onHidePhrase?: () => void;
  onHideUser?: () => void;
  onHighlightUser?: () => void;
  onReportUser?: () => void;
  onBlockUser?: () => void;
  onPinMessage?: () => void;
  onUpdatePinnedMessage?: () => void;
  onUnpinMessage?: () => void;
  onDeleteMessage?: () => void;
  onTimeoutUser?: () => void;
  onBanUser?: () => void;
  isUserHighlighted?: boolean;
  isPinnedMessage?: boolean;
  isPinnedMessageBusy?: boolean;
  canModerateChat?: boolean;
  canDeleteMessage?: boolean;
  canPinMessage?: boolean;
  canModerateUser?: boolean;
}

type MessageActionSection = {
  key: string;
  title?: string;
  rows: SheetAction[];
};

function buildMessageActionSections(
  props: ActionSheetProps,
): MessageActionSection[] {
  const {
    username,
    onReply,
    onCopy,
    onHidePhrase,
    onHideUser,
    onHighlightUser,
    onPinMessage,
    onUpdatePinnedMessage,
    onUnpinMessage,
    onDeleteMessage,
    onTimeoutUser,
    onBanUser,
    onReportUser,
    onBlockUser,
    isUserHighlighted,
    isPinnedMessage,
    isPinnedMessageBusy,
    canModerateChat,
    canDeleteMessage,
    canPinMessage,
    canModerateUser,
  } = props;

  const canChangePin = Boolean(
    canModerateChat && canPinMessage && !isPinnedMessageBusy,
  );

  const respond: SheetAction[] = [
    { icon: 'arrowshape.turn.up.left', label: 'Reply', onPress: onReply },
    { icon: 'doc.on.doc', label: 'Copy message', onPress: onCopy },
  ];

  const filter: SheetAction[] = [
    ...(username
      ? [
          {
            icon: isUserHighlighted
              ? ('star.slash' as const)
              : ('star' as const),
            label: isUserHighlighted ? 'Remove highlight' : 'Highlight user',
            onPress: () => onHighlightUser?.(),
          },
          {
            icon: 'eye.slash' as const,
            label: 'Hide user',
            onPress: () => onHideUser?.(),
          },
        ]
      : []),
    { icon: 'nosign', label: 'Hide phrase', onPress: () => onHidePhrase?.() },
  ];

  const pin: SheetAction[] = [];

  if (canChangePin && isPinnedMessage) {
    pin.push(
      {
        icon: 'pin.fill',
        label: 'Refresh pin',
        onPress: () => onUpdatePinnedMessage?.(),
      },
      {
        icon: 'pin.slash',
        label: 'Unpin message',
        onPress: () => onUnpinMessage?.(),
      },
    );
  }

  if (canChangePin && !isPinnedMessage) {
    pin.push({
      icon: 'pin',
      label: 'Pin message',
      onPress: () => onPinMessage?.(),
    });
  }

  const safety: SheetAction[] = [
    ...(username
      ? [
          {
            icon: 'flag' as const,
            label: 'Report message',
            onPress: () => onReportUser?.(),
          },
        ]
      : []),
    ...(username && onBlockUser ? [blockUserAction(onBlockUser)] : []),
  ];

  const moderation: SheetAction[] = [
    ...(canModerateChat && canDeleteMessage
      ? [
          {
            icon: 'trash' as const,
            label: 'Delete message',
            onPress: () => onDeleteMessage?.(),
            destructive: true,
          },
        ]
      : []),
    ...(canModerateChat && canModerateUser
      ? [
          timeoutUserAction(() => onTimeoutUser?.()),
          banUserAction(() => onBanUser?.()),
        ]
      : []),
  ];

  const sections: MessageActionSection[] = [
    { key: 'respond', rows: respond },
    { key: 'filter', rows: filter },
    { key: 'pin', rows: pin },
    { key: 'safety', rows: safety },
    { key: 'moderation', title: 'Moderation', rows: moderation },
  ];

  return sections.filter(section => section.rows.length > 0);
}

function ActionSheetComponent(props: ActionSheetProps) {
  const { onDismiss, username, usernameColor, messagePreview } = props;
  const { requestClose, runAndClose, sheetRef } = useChatSheet();
  const sections = buildMessageActionSections(props);

  const layout: ChatSheetLayout = {
    chromeHeight: SHEET_CHROME.messageActions,
    kind: 'content',
    minHeight: SHEET_CHROME.messageActionsMinHeight,
    sections: sections.map(section => ({
      rowCount: section.rows.length,
      titled: Boolean(section.title),
    })),
  };

  const sheetHeight = useChatSheetHeight(layout);

  return (
    <ChatSheet
      ref={sheetRef}
      onDismiss={onDismiss}
      layout={layout}
      testID='message-action-sheet'
    >
      <View
        style={[
          chatSheetStyles.wrapper,
          { maxHeight: sheetHeight - theme.space16 },
        ]}
      >
        <SheetHeader
          title={username ? `Message from ${username}` : 'Message'}
          onClose={requestClose}
        />

        <ScrollView
          nestedScrollEnabled
          style={chatSheetStyles.scroll}
          contentContainerStyle={chatSheetStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messagePreview ? (
            <MessageActionPreview
              message={messagePreview}
              username={username}
              usernameColor={usernameColor}
            />
          ) : null}

          {/* oxlint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- at most five fixed groups of rows, not a data list */}
          {sections.map(section => (
            <SheetActionGroup
              key={section.key}
              title={section.title}
              actions={section.rows.map(row => ({
                ...row,
                onPress: () => runAndClose(row.onPress),
              }))}
            />
          ))}
        </ScrollView>
      </View>
    </ChatSheet>
  );
}

export const ActionSheet = memo(ActionSheetComponent);
