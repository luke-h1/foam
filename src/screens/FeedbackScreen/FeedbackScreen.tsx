import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { Button } from '@app/components/Button/Button';
import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { impact } from '@app/lib/haptics';
import { type FeedbackType, sendFeedback } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';

const FEEDBACK_TYPES: {
  value: FeedbackType;
  labelKey: 'typeBug' | 'typeIdea';
}[] = [
  { value: 'bug', labelKey: 'typeBug' },
  { value: 'idea', labelKey: 'typeIdea' },
];

export function FeedbackScreen() {
  const { t } = useTranslation('feedback');
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
        toast.error(t('emptyMessage'));
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
      void impact('light');
      toast.success(t('success'));

      if (router.canDismiss()) {
        router.dismiss();
      } else {
        router.back();
      }
    } catch {
      setSubmitting(false);
      toast.error(t('error'));
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <KeyboardAvoidingView behavior='padding' style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode='on-drag'
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text type='2xl' weight='bold' color='gray.text'>
              {t('title')}
            </Text>
            <Text type='sm' color='gray.textLow' style={styles.subtitle}>
              {t('subtitle')}
            </Text>
          </View>

          <SegmentedControl
            currentIndex={selectedTypeIndex < 0 ? 0 : selectedTypeIndex}
            items={FEEDBACK_TYPES.map(option => ({
              label: t(option.labelKey),
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
              {t('messageLabel')}
            </Text>
            <TextInput
              autoCapitalize='sentences'
              autoCorrect
              multiline
              onChangeText={setMessage}
              placeholder={
                type === 'bug'
                  ? t('messagePlaceholderBug')
                  : t('messagePlaceholderIdea')
              }
              placeholderTextColor={theme.colorGreyHoverAlpha}
              selectionColor={theme.color.text.dark}
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
              {t('emailLabel')}
            </Text>
            <TextInput
              autoCapitalize='none'
              autoComplete='email'
              autoCorrect={false}
              inputMode='email'
              keyboardType='email-address'
              onChangeText={setEmail}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor={theme.colorGreyHoverAlpha}
              selectionColor={theme.color.text.dark}
              style={styles.input}
              value={email}
            />
          </View>

          <Button
            disabled={!canSubmit}
            haptic='light'
            label={t('submit')}
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
              {submitting ? t('submitting') : t('submit')}
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
    paddingTop: theme.space24,
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
  header: {
    gap: theme.space8,
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
