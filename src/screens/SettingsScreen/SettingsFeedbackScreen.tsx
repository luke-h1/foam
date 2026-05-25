import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { useAuthContext } from '@app/context/AuthContext';
import { FeedbackWidget } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

const feedbackWidgetCopy = {
  addScreenshotButtonLabel: 'Add a screenshot',
  cancelButtonLabel: 'Cancel',
  captureScreenshotButtonLabel: 'Take a screenshot',
  captureScreenshotError: 'Could not capture a screenshot. Please try again.',
  emailError: 'Please enter a valid email address.',
  emailLabel: 'Email',
  emailPlaceholder: 'your.email@example.com',
  errorTitle: 'Something went wrong',
  formError: 'Please add a message before sending feedback.',
  formTitle: 'Send Feedback',
  genericError: 'Unable to send feedback right now.',
  isRequiredLabel: '(required)',
  messageLabel: 'Feedback',
  messagePlaceholder: 'What could be better?',
  nameLabel: 'Name',
  namePlaceholder: 'Your name',
  removeScreenshotButtonLabel: 'Remove screenshot',
  submitButtonLabel: 'Send Feedback',
  successMessageText: 'Thanks for the feedback.',
} as const;

function closeFeedbackScreen() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/tabs/settings');
}

export function SettingsFeedbackScreen() {
  const { user } = useAuthContext();

  return (
    <View style={styles.container}>
      <BodyScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Send Feedback"
          subtitle="Share what is working, what is confusing, or what should be better."
          size="medium"
        />

        <FeedbackWidget
          {...feedbackWidgetCopy}
          enableScreenshot={false}
          isEmailRequired={false}
          isNameRequired={false}
          onAddScreenshot={() => {}}
          onFormClose={closeFeedbackScreen}
          onFormOpen={() => {}}
          onFormSubmitted={closeFeedbackScreen}
          onSubmitError={() => {}}
          onSubmitSuccess={() => {}}
          shouldValidateEmail
          showBranding={false}
          showEmail
          showName
          useSentryUser={{
            email: '',
            name: user?.display_name ?? user?.login ?? '',
          }}
        />
      </BodyScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: theme.space56,
    paddingTop: theme.space12,
  },
});
