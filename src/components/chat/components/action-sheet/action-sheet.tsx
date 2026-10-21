import { memo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/bottom-sheet/bottom-sheet';
import { SheetHeader } from '@app/components/chat/components/sheet/sheet-header';
import {
  type SheetAction,
  SheetActionGroup,
} from '@app/components/chat/components/sheet-action-group';
import {
  banUserAction,
  blockUserAction,
  timeoutUserAction,
} from '@app/components/chat/util/user-sheet-actions';
import { theme } from '@app/styles/themes';
import type { MessageToken } from '@app/utils/chat/message-token';

import { MessageActionPreview } from './message-action-preview';

interface Props {
  visible: boolean;
  onClose: () => void;
  username?: string;
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

/**
 * Groups the message actions by purpose: respond, filter, pin, report, then
 * moderation. Empty groups are dropped.
 */
function buildMessageActionSections(props: Props): MessageActionSection[] {
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

function ActionSheetComponent(props: Props) {
  const { visible, onClose, username, messagePreview } = props;
  const sheetRef = useRef<BottomSheetHandle>(null);

  const requestClose = () => {
    sheetRef.current?.requestClose();
  };

  const sections = buildMessageActionSections(props);

  const rowCount = sections.reduce(
    (count, section) => count + section.rows.length,
    0,
  );

  const titledSectionCount = sections.filter(section => section.title).length;

  const { height: windowHeight } = useWindowDimensions();

  // Header, preview and padding, then each row and group gap on top.
  const sheetHeight = Math.min(
    Math.round(windowHeight * 0.82),
    Math.max(
      360,
      196 + rowCount * 57 + sections.length * 24 + titledSectionCount * 26,
    ),
  );

  const snapPoints = [{ height: sheetHeight }];

  return (
    <BottomSheet
      ref={sheetRef}
      enableFixedSnapPoints
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator
      snapPoints={snapPoints}
      testID='message-action-sheet'
    >
      <View
        style={[styles.wrapper, { maxHeight: sheetHeight - theme.space16 }]}
      >
        <SheetHeader
          title={username ? `Message from ${username}` : 'Message'}
          onClose={requestClose}
        />

        <ScrollView
          nestedScrollEnabled
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messagePreview ? (
            <MessageActionPreview
              message={messagePreview}
              username={username}
            />
          ) : null}

          {/* eslint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- at most five fixed groups of rows, not a data list */}
          {sections.map(section => (
            <SheetActionGroup
              key={section.key}
              title={section.title}
              actions={section.rows.map(row => ({
                ...row,
                onPress: () => {
                  row.onPress();
                  requestClose();
                },
              }))}
            />
          ))}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

export const ActionSheet = memo(ActionSheetComponent);

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  /**
   * No gap: each `SettingsSection` carries its own bottom margin.
   */
  scrollContent: {
    paddingBottom: theme.space16,
  },
  wrapper: {
    alignSelf: 'stretch',
    gap: theme.space16,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
    width: '100%',
  },
});
