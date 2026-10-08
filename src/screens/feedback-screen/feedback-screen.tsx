import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { Button } from '@app/components/button/button';
import { SegmentedControl } from '@app/components/segmented-control/segmented-control';
import { Input } from '@app/components/ui/input/input';
import { Text } from '@app/components/ui/text/text';
import { useAuthContext } from '@app/context/auth-context';
import { notification } from '@app/lib/haptics';
import { type FeedbackType, sendFeedback } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';

const FEEDBACK_TYPES: {
  value: FeedbackType;
  label: string;
}[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'idea', label: 'Idea' },
];

function handleDismiss() {
  if (router.canDismiss()) {
    router.dismiss();
    return;
  }

  router.back();
}

export function FeedbackScreen() {
  const { user } = useAuthContext();

  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trimmedMessage = message.trim();
  const canSubmit = trimmedMessage.length > 0 && !submitting;

  const selectedTypeIndex = FEEDBACK_TYPES.findIndex(
    option => option.value === type,
  );

  const handleSubmit = () => {
    if (!canSubmit && trimmedMessage.length === 0) {
      notification('error');
      toast.error('Enter a message first.');
      return;
    }

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      sendFeedback({
        type,
        message: trimmedMessage,
        email: email.trim(),
        name: user?.display_name,
      });

      notification('success');
      toast.success('Feedback sent. Thank you.');

      handleDismiss();
    } catch {
      setSubmitting(false);
      notification('error');
      toast.error("Couldn't send feedback. Try again.");
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.sheetHeader}>
        <Button
          label='Cancel'
          onPress={handleDismiss}
          hitSlop={10}
          style={styles.headerSide}
        >
          <Text type='body' color='accent'>
            Cancel
          </Text>
        </Button>
        <Text
          type='headline'
          align='center'
          numberOfLines={1}
          style={styles.headerTitle}
        >
          Send feedback
        </Text>
        <Button
          label='Send'
          haptic='light'
          disabled={!canSubmit}
          onPress={handleSubmit}
          hitSlop={10}
          style={[styles.headerSide, styles.headerSideEnd]}
        >
          <Text
            type='headline'
            color='accent'
            style={canSubmit ? null : styles.sendDisabled}
          >
            {submitting ? 'Sending…' : 'Send'}
          </Text>
        </Button>
      </View>
      <KeyboardAvoidingView behavior='padding' style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode='on-drag'
          keyboardShouldPersistTaps='handled'
          indicatorStyle='white'
        >
          <Text type='subhead' color='gray.textLow'>
            Found a bug or have an idea? Tell us and it goes straight to the
            team.
          </Text>

          <SegmentedControl
            currentIndex={selectedTypeIndex < 0 ? 0 : selectedTypeIndex}
            items={FEEDBACK_TYPES.map(option => ({
              label: option.label,
            }))}
            onChange={index => {
              const next = FEEDBACK_TYPES[index];
              if (next) {
                setType(next.value);
              }
            }}
          />

          <View style={styles.field}>
            <Text
              type='footnote'
              weight='semibold'
              color='gray.textLow'
              style={styles.fieldLabel}
            >
              Message
            </Text>
            <Input
              autoCapitalize='sentences'
              autoCorrect
              multiline
              onChangeText={setMessage}
              placeholder={
                type === 'bug'
                  ? 'What went wrong, and what were you doing?'
                  : 'What would make Foam better?'
              }
              placeholderTextColor={theme.color.textFaint.dark}
              style={[styles.input, styles.messageInput]}
              value={message}
            />
          </View>

          <View style={styles.field}>
            <Text
              type='footnote'
              weight='semibold'
              color='gray.textLow'
              style={styles.fieldLabel}
            >
              Email (optional)
            </Text>
            <Input
              autoCapitalize='none'
              autoComplete='email'
              autoCorrect={false}
              inputMode='email'
              keyboardType='email-address'
              onChangeText={setEmail}
              placeholder='you@example.com, so we can follow up'
              placeholderTextColor={theme.color.textFaint.dark}
              style={styles.input}
              value={email}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.surface.dark,
    flex: 1,
  },
  content: {
    gap: theme.space20,
    paddingBottom: theme.space24,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space16,
  },
  field: {
    gap: theme.space8,
  },
  fieldLabel: {
    paddingHorizontal: theme.space4,
  },
  flex: {
    flex: 1,
  },
  headerSide: {
    width: 72,
  },
  headerSideEnd: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    flex: 1,
  },
  input: {
    backgroundColor: theme.color.surfaceElevated.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    borderWidth: 0,
    color: theme.color.text.dark,
    fontSize: theme.fontSize16,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  messageInput: {
    minHeight: 132,
    textAlignVertical: 'top',
  },
  sendDisabled: {
    opacity: 0.35,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
  },
});
