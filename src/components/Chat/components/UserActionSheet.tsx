import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { Modal, StyleSheet, View } from 'react-native';

interface UserActionSheetProps {
  isHidden: boolean;
  isHighlighted: boolean;
  login?: string;
  onClose: () => void;
  onCopyUsername: () => void;
  onHideUser: () => void;
  onHighlightUser: () => void;
  onMentionUser: () => void;
  username: string;
  visible: boolean;
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
  username,
  visible,
}: UserActionSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.username}>{username}</Text>
          {login && login !== username ? (
            <Text style={styles.login}>@{login}</Text>
          ) : null}
        </View>

        <View style={styles.actionGroup}>
          <Button style={styles.actionButton} onPress={onMentionUser}>
            <Icon icon="at-sign" size={18} />
            <Text style={styles.actionText}>Mention</Text>
          </Button>

          <Button style={styles.actionButton} onPress={onCopyUsername}>
            <Icon icon="copy" size={18} />
            <Text style={styles.actionText}>Copy Username</Text>
          </Button>

          <Button style={styles.actionButton} onPress={onHideUser}>
            <Icon icon="user-x" size={18} />
            <Text style={styles.actionText}>
              {isHidden ? 'Unhide User' : 'Hide User'}
            </Text>
          </Button>

          <Button style={styles.actionButton} onPress={onHighlightUser}>
            <Icon icon="star" size={18} />
            <Text style={styles.actionText}>
              {isHighlighted ? 'Unhighlight User' : 'Highlight User'}
            </Text>
          </Button>
        </View>

        <Button style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Done</Text>
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  actionGroup: {
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
  },
  actionText: {
    fontSize: theme.font.fontSize.md,
    fontWeight: '500',
  },
  closeButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  closeText: {
    fontSize: theme.font.fontSize.sm,
    fontWeight: '600',
  },
  header: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  login: {
    color: theme.colors.gray.textLow,
    fontSize: theme.font.fontSize.sm,
  },
  username: {
    fontSize: theme.font.fontSize.lg,
    fontWeight: '700',
  },
  wrapper: {
    backgroundColor: '#171b23',
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
});
