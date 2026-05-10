import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';

interface UserActionSheetProps {
  isHidden: boolean;
  isHighlighted: boolean;
  login?: string;
  onClose: () => void;
  onCopyUsername: () => void;
  onHideUser: () => void;
  onHighlightUser: () => void;
  onMentionUser: () => void;
  onTimeoutUser?: () => void;
  onBanUser?: () => void;
  username: string;
  visible: boolean;
  canModerateChat?: boolean;
  canModerateUser?: boolean;
}

export function UserActionSheet({
  isHidden,
  isHighlighted,
  login,
  onClose,
  onCopyUsername,
  onHideUser,
  onHighlightUser,
  onMentionUser,
  onTimeoutUser,
  onBanUser,
  username,
  visible,
  canModerateChat,
  canModerateUser,
}: UserActionSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.wrapper}>
          <View style={styles.header}>
            <View>
              <Text style={styles.username}>{username}</Text>
              {login && login !== username ? (
                <Text style={styles.login}>@{login}</Text>
              ) : null}
            </View>
            <Button style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneText}>Done</Text>
            </Button>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.actionGroup}>
              <Button
                style={[styles.actionButton, styles.actionButtonBorder]}
                onPress={onMentionUser}
              >
                <Icon icon="at-sign" size={18} />
                <Text style={styles.actionText}>Mention</Text>
              </Button>

              <Button
                style={[styles.actionButton, styles.actionButtonBorder]}
                onPress={onCopyUsername}
              >
                <Icon icon="copy" size={18} />
                <Text style={styles.actionText}>Copy Username</Text>
              </Button>

              <Button
                style={[styles.actionButton, styles.actionButtonBorder]}
                onPress={onHideUser}
              >
                <Icon icon="user-x" size={18} />
                <Text style={styles.actionText}>
                  {isHidden ? 'Unhide User' : 'Hide User'}
                </Text>
              </Button>

              <Button
                style={[
                  styles.actionButton,
                  !canModerateChat || !canModerateUser
                    ? null
                    : styles.actionButtonBorder,
                ]}
                onPress={onHighlightUser}
              >
                <Icon icon="star" size={18} />
                <Text style={styles.actionText}>
                  {isHighlighted ? 'Unhighlight User' : 'Highlight User'}
                </Text>
              </Button>

              {canModerateChat && canModerateUser ? (
                <>
                  <Button
                    style={[styles.actionButton, styles.actionButtonBorder]}
                    onPress={onTimeoutUser}
                  >
                    <Icon icon="clock" size={18} />
                    <Text style={styles.actionText}>Timeout for 10m</Text>
                  </Button>

                  <Button style={styles.actionButton} onPress={onBanUser}>
                    <Icon icon="slash" size={18} />
                    <Text style={styles.actionText}>Ban User</Text>
                  </Button>
                </>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 48,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  actionButtonBorder: {
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionGroup: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    fontWeight: '500',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.space20,
  },
  doneButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  doneText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.space16,
    paddingBottom: theme.space16,
  },
  login: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize14,
  },
  username: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize18,
    fontWeight: '700',
  },
  wrapper: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: theme.space16,
    maxHeight: '82%',
    overflow: 'hidden',
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.space20,
  },
});
