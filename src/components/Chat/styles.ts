import { theme } from '@app/styles/themes';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    maxWidth: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  connectingContainer: {
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  connectingText: {
    color: theme.colorGrey,
    fontSize: theme.fontSize14,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    marginHorizontal: theme.space12,
    marginTop: theme.space12,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space20,
  },
  emptyStateBody: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    marginTop: theme.space8,
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: theme.fontSize14,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputStickyView: {
    zIndex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.space8,
    paddingTop: 0,
  },
  listGestureWrapper: {
    flex: 1,
  },
  messagePane: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 0,
    paddingHorizontal: 6,
    paddingVertical: 3,
    width: '100%',
  },
  pinnedIconShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(145,91,255,0.28)',
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  pinnedMessageActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  pinnedMessageActions: {
    flexDirection: 'row',
    gap: theme.space8,
  },
  pinnedMessageBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(34,34,38,0.96)',
    borderBottomColor: 'rgba(255,255,255,0.10)',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  pinnedMessageContent: {
    flex: 1,
    minWidth: 0,
  },
  pinnedMessageText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: theme.fontSize12,
    lineHeight: 18,
  },
  pinnedMessageTitle: {
    color: '#ffffff',
    fontSize: theme.fontSize12,
    lineHeight: 16,
  },
  wrapper: {
    backgroundColor: '#000',
    flex: 1,
  },
  wrapperTransparent: {
    backgroundColor: 'transparent',
  },
});
