import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { Button } from '@app/components/button/button';
import { Text } from '@app/components/ui/text/text';
import { twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { logger } from '@app/utils/logger';

import { openWhisperConversation } from './util/open-whisper-conversation';

export function WhispersComposeScreen() {
  const [login, setLogin] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleContinue = useCallback(async () => {
    const normalised = normaliseChatUsername(login);

    if (!normalised || isLookingUp) {
      return;
    }

    setIsLookingUp(true);

    try {
      const user = await twitchService.getUser(normalised);

      if (!user?.id || !user.login) {
        toast.error('No Twitch user found with that login.');
        return;
      }

      router.back();

      openWhisperConversation({
        displayName: user.display_name || user.login,
        login: user.login,
        userId: user.id,
      });
    } catch (error) {
      logger.chat.error('Failed to look up whisper partner', error);
      toast.error('Could not look up that user.');
    } finally {
      setIsLookingUp(false);
    }
  }, [isLookingUp, login]);

  const canContinue = Boolean(normaliseChatUsername(login)) && !isLookingUp;

  return (
    <View style={styles.root}>
      <Text type='headline' style={styles.title}>
        New whisper
      </Text>
      <Text type='body' color='gray.textLow' style={styles.body}>
        Enter a Twitch login.
      </Text>
      <TextInput
        value={login}
        onChangeText={setLogin}
        autoCapitalize='none'
        autoCorrect={false}
        placeholder='login'
        placeholderTextColor={theme.color.textFaint.dark}
        onSubmitEditing={() => {
          void handleContinue();
        }}
        style={styles.input}
      />
      <Button
        disabled={!canContinue}
        onPress={() => {
          void handleContinue();
        }}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        {isLookingUp ? (
          <ActivityIndicator color={theme.color.onAccent.dark} />
        ) : (
          <Text type='callout' weight='semibold' style={styles.buttonText}>
            Continue
          </Text>
        )}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
    gap: 12,
    padding: 20,
  },
  title: {
    color: theme.color.text.dark,
  },
  body: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.color.surfaceElevated.dark,
    borderCurve: 'continuous',
    borderRadius: 12,
    color: theme.color.text.dark,
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.color.accent.dark,
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: theme.color.onAccent.dark,
  },
});
