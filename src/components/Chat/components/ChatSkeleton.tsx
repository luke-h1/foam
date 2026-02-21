import { SafeAreaViewFixed } from '@app/components/SafeAreaViewFixed/SafeAreaViewFixed';
import { useWindowDimensions, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { FlashList } from '../../FlashList/FlashList';

export function ChatSkeleton() {
  const { width, height } = useWindowDimensions();

  const chatWidth = width;
  const chatHeight = height * 0.6;
  return (
    <SafeAreaViewFixed style={styles.safeArea}>
      <View
        style={[styles.chatContainer, { width: chatWidth, height: chatHeight }]}
      >
        <FlashList
          contentInsetAdjustmentBehavior="automatic"
          data={new Array(20)}
          renderItem={({ index }) => (
            <View key={index} style={styles.skeletonMessageContainer}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonUsername} />
                <View style={styles.skeletonMessage} />
              </View>
            </View>
          )}
        />
      </View>
      <View style={styles.inputContainer} />
    </SafeAreaViewFixed>
  );
}

const styles = StyleSheet.create(theme => ({
  chatContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skeletonMessageContainer: {
    flexDirection: 'row',
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#2d2d2d',
  },
  skeletonAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2d2d2d',
  },
  skeletonContent: {
    flex: 1,
    gap: 4,
  },
  skeletonUsername: {
    width: 80,
    height: 14,
    backgroundColor: '#2d2d2d',
    borderRadius: 4,
  },
  skeletonMessage: {
    width: '50%',
    height: 14,
    backgroundColor: '#2d2d2d',
    borderRadius: 4,
  },
  skeletonInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#2d2d2d',
    borderRadius: 18,
  },
}));
