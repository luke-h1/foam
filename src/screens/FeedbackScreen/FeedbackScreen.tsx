import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { PressableScale } from 'pressto';
import { toast } from 'sonner-native';

import { Button } from '@app/components/Button/Button';
import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import { Input } from '@app/components/ui/Input/Input';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
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
    if (!canSubmit) {
      if (trimmedMessage.length === 0) {
        notification('error');
        toast.error('Please enter a message first.');
      }
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
      toast.success('Your feedback was sent - we appreciate it.');

      handleDismiss();
    } catch {
      setSubmitting(false);
      notification('error');
      toast.error("Couldn't send your feedback. Please try again.");
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.sheetHeader}>
        <PressableScale
          accessibilityRole='button'
          onPress={handleDismiss}
          hitSlop={8}
          style={styles.headerSide}
        >
          <Text type='md' style={{ color: theme.colorPrimary }}>
            Cancel
          </Text>
        </PressableScale>
        <Text
          type='md'
          weight='semibold'
          color='gray.text'
          align='center'
          numberOfLines={1}
          style={styles.headerTitle}
        >
          Send feedback
        </Text>
        <View style={styles.headerSide} />
      </View>
      <KeyboardAvoidingView behavior='padding' style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode='on-drag'
          keyboardShouldPersistTaps='handled'
          indicatorStyle='white'
        >
          <Text type='sm' color='gray.textLow' style={styles.subtitle}>
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
              type='xxs'
              weight='semibold'
              color='gray.textLow'
              style={styles.fieldLabel}
            >
              MESSAGE
            </Text>
            <Input
              autoCapitalize='sentences'
              autoCorrect
              multiline
              onChangeText={setMessage}
              placeholder={
                type === 'bug'
                  ? 'What went wrong, and what were you doing when it happened?'
                  : 'What would make Foam better?'
              }
              placeholderTextColor={theme.colorGreyHoverAlpha}
              style={[styles.input, styles.messageInput]}
              value={message}
            />
          </View>

          <View style={styles.field}>
            <Text
              type='xxs'
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
              placeholderTextColor={theme.colorGreyHoverAlpha}
              style={styles.input}
              value={email}
            />
          </View>

          <Button
            disabled={!canSubmit}
            haptic='light'
            label='Send'
            onPress={handleSubmit}
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
          >
            <Text
              type='sm'
              weight='bold'
              color='accent'
              contrast
              align='center'
            >
              {submitting ? 'Sending…' : 'Send'}
            </Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    gap: theme.space20,
    paddingBottom: theme.space24,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  field: {
    gap: theme.space8,
  },
  fieldLabel: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  flex: {
    flex: 1,
  },
  headerSide: {
    width: 64,
  },
  headerTitle: {
    flex: 1,
  },
  input: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: StyleSheet.hairlineWidth,
    color: theme.color.text.dark,
    fontSize: theme.fontSize16,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  messageInput: {
    minHeight: 132,
    textAlignVertical: 'top',
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
  },
  subtitle: {
    lineHeight: theme.fontSize14 * 1.5,
  },
  submit: {
    alignItems: 'center',
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    justifyContent: 'center',
    marginTop: theme.space4,
    minHeight: 52,
    paddingHorizontal: theme.space24,
    paddingVertical: theme.space16,
  },
  submitDisabled: {
    opacity: 0.5,
  },
});
