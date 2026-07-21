import { memo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/BottomSheet/BottomSheet';
import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { type ActionItem, ActionSheetRow } from './ActionSheetRow';
import { MessageActionPreview } from './MessageActionPreview';

interface Props {
  visible: boolean;
  onClose: () => void;
  username?: string;
  messagePreview?: ParsedPart[];
  onReply: () => void;
  onCopy: () => void;
  onHidePhrase?: () => void;
  onHideUser?: () => void;
  onHighlightUser?: () => void;
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

function ActionSheetComponent(props: Props) {
  const { t } = useTranslation(['chat', 'common']);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const {
    visible,
    onClose,
    username,
    messagePreview,
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
    isUserHighlighted,
    isPinnedMessage,
    isPinnedMessageBusy,
    canModerateChat,
    canDeleteMessage,
    canPinMessage,
    canModerateUser,
  } = props;
  const sheetRef = useRef<BottomSheetHandle>(null);
  const requestClose = () => {
    sheetRef.current?.requestClose();
  };
  const runAndClose = (action?: () => void) => {
    action?.();
    requestClose();
  };

  const actions: ActionItem[] = [
    {
      id: 'copy',
      label: t('messageActions.copyMessage'),
      subtitle: t('messageActions.copyMessageSubtitle'),
      onPress: () => runAndClose(onCopy),
    },
    {
      id: 'reply',
      label: t('messageActions.reply'),
      subtitle: t('messageActions.replySubtitle'),
      tone: 'accent',
      onPress: () => runAndClose(onReply),
    },
    ...(username
      ? ([
          {
            id: 'hide-user',
            label: t('userActions.hideUser'),
            subtitle: t('userActions.hideUserSubtitle'),
            onPress: () => runAndClose(onHideUser),
          },
          {
            id: 'highlight-user',
            label: isUserHighlighted
              ? t('userActions.unhighlightUser')
              : t('userActions.highlightUser'),
            subtitle: isUserHighlighted
              ? t('userActions.unhighlightUserSubtitle')
              : t('userActions.highlightUserSubtitle'),
            tone: 'accent',
            onPress: () => runAndClose(onHighlightUser),
          },
        ] as const)
      : []),
    {
      id: 'hide-phrase',
      label: t('messageActions.hidePhrase'),
      subtitle: t('messageActions.hidePhraseSubtitle'),
      onPress: () => runAndClose(onHidePhrase),
    },
    ...(canModerateChat && canPinMessage && !isPinnedMessageBusy
      ? isPinnedMessage
        ? ([
            {
              id: 'update-pin',
              label: t('messageActions.refreshPin'),
              subtitle: t('messageActions.refreshPinSubtitle'),
              tone: 'accent',
              onPress: () => runAndClose(onUpdatePinnedMessage),
            },
            {
              id: 'unpin-message',
              label: t('messageActions.unpinMessage'),
              subtitle: t('messageActions.unpinMessageSubtitle'),
              onPress: () => runAndClose(onUnpinMessage),
            },
          ] as const)
        : ([
            {
              id: 'pin-message',
              label: t('messageActions.pinMessage'),
              subtitle: t('messageActions.pinMessageSubtitle'),
              tone: 'accent',
              onPress: () => runAndClose(onPinMessage),
            },
          ] as const)
      : []),
    ...(canModerateChat && canDeleteMessage
      ? ([
          {
            id: 'delete-message',
            label: t('messageActions.deleteMessage'),
            subtitle: t('messageActions.deleteMessageSubtitle'),
            tone: 'danger',
            onPress: () => runAndClose(onDeleteMessage),
          },
        ] as const)
      : []),
    ...(canModerateChat && canModerateUser
      ? ([
          {
            id: 'timeout-user',
            label: t('userActions.timeoutUser'),
            subtitle: t('userActions.timeoutUserSubtitle'),
            tone: 'warning',
            onPress: () => runAndClose(onTimeoutUser),
          },
          {
            id: 'ban-user',
            label: t('userActions.banUser'),
            subtitle: t('userActions.banUserSubtitle'),
            tone: 'danger',
            onPress: () => runAndClose(onBanUser),
          },
        ] as const)
      : []),
  ];
  const { height: windowHeight } = useWindowDimensions();
  const maxScrollHeight = Math.min(
    Math.round(windowHeight * 0.62),
    actions.length * 58 + 116,
  );
  const sheetHeight = Math.min(
    Math.round(windowHeight * 0.82),
    Math.max(360, actions.length * 58 + 224),
  );
  const snapPoints = [{ height: sheetHeight }];
  const wrapperStyle = [
    styles.wrapper,
    {
      maxHeight: sheetHeight - theme.space16,
    },
  ];
  const scrollStyle = [styles.scroll, { maxHeight: maxScrollHeight }];

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
      <View style={wrapperStyle}>
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.eyebrow,
                { color: theme.color.textSecondary[scheme] },
              ]}
              weight='semibold'
            >
              {t('messageActions.eyebrow')}
            </Text>
            <Text
              style={[styles.title, { color: theme.color.text[scheme] }]}
              weight='semibold'
            >
              {t('messageActions.title')}
            </Text>
          </View>
          <Button
            label={t('common:done')}
            onPress={requestClose}
            style={[
              styles.closeButton,
              { backgroundColor: theme.color.pressedOverlay[scheme] },
            ]}
          >
            <SymbolView
              name='xmark'
              size={15}
              weight='semibold'
              tintColor={theme.color.textSecondary[scheme]}
            />
          </Button>
        </View>

        <ScrollView
          style={scrollStyle}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messagePreview ? (
            <MessageActionPreview
              message={messagePreview}
              username={username}
            />
          ) : null}

          <View
            style={[
              styles.actionGroup,
              { backgroundColor: theme.color.surfaceAlpha[scheme] },
            ]}
          >
            {actions.map((action, index) => (
              <ActionSheetRow
                key={action.id}
                action={action}
                showBottomBorder={index < actions.length - 1}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

export const ActionSheet = memo(ActionSheetComponent);

const styles = StyleSheet.create({
  actionGroup: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
  closeButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  eyebrow: {
    fontSize: theme.fontSize11,
    letterSpacing: 0.6,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.space4,
  },
  title: {
    fontSize: theme.fontSize16,
    lineHeight: theme.fontSize16 * 1.25,
  },
  wrapper: {
    alignSelf: 'stretch',
    gap: theme.space12,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
    width: '100%',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: theme.space12,
    paddingBottom: theme.space16,
  },
});
