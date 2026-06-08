import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { StyleSheet, View } from 'react-native';
import type { ChatCommandFeedback } from '../util/chatCommands';

interface ChatCommandFeedbackProps {
  feedback: ChatCommandFeedback | null;
}

export function ChatCommandFeedbackView({
  feedback,
}: ChatCommandFeedbackProps) {
  if (!feedback || feedback.status === 'valid' || !feedback.message) {
    return null;
  }

  const isError = feedback.status === 'error';

  return (
    <View style={styles.container}>
      <Text style={[styles.text, isError ? styles.textError : styles.textHint]}>
        {feedback.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  text: {
    fontSize: theme.fontSize12,
    lineHeight: 16,
  },
  textError: {
    color: '#FF453A',
  },
  textHint: {
    color: 'rgba(255,255,255,0.56)',
  },
});
