import { useSyncExternalStore } from 'react';
import { Linking, StyleSheet } from 'react-native';

import { AlertDialog, Host, Text, TextButton } from '@expo/ui/jetpack-compose';

import { theme } from '@app/styles/themes';

import {
  getMediaPermissionState,
  resolveMediaPermissionPrompt,
  subscribeMediaPermission,
} from './mediaPermissionStore';

export function MediaPermissionHost() {
  const prompt = useSyncExternalStore(
    subscribeMediaPermission,
    getMediaPermissionState,
    getMediaPermissionState,
  );

  if (!prompt) {
    return null;
  }

  return (
    <Host
      colorScheme='dark'
      style={StyleSheet.absoluteFill}
      pointerEvents='box-none'
    >
      <AlertDialog
        colors={{
          containerColor: theme.color.menu.card,
          titleContentColor: theme.color.text.dark,
          textContentColor: theme.color.textSecondary.dark,
        }}
        onDismissRequest={() => resolveMediaPermissionPrompt()}
      >
        <AlertDialog.Title>
          <Text
            color={theme.color.text.dark}
            style={{ typography: 'headlineSmall', fontWeight: '700' }}
          >
            {prompt.title}
          </Text>
        </AlertDialog.Title>
        <AlertDialog.Text>
          <Text
            color={theme.color.textSecondary.dark}
            style={{ typography: 'bodyMedium' }}
          >
            {prompt.message}
          </Text>
        </AlertDialog.Text>
        <AlertDialog.DismissButton>
          <TextButton
            colors={{ contentColor: theme.color.textSecondary.dark }}
            onClick={() => resolveMediaPermissionPrompt()}
          >
            <Text color={theme.color.textSecondary.dark}>
              {prompt.cancelLabel}
            </Text>
          </TextButton>
        </AlertDialog.DismissButton>
        <AlertDialog.ConfirmButton>
          <TextButton
            colors={{ contentColor: theme.color.accent.dark }}
            onClick={() => {
              void Linking.openSettings();
              resolveMediaPermissionPrompt();
            }}
          >
            <Text color={theme.color.accent.dark}>{prompt.settingsLabel}</Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
      </AlertDialog>
    </Host>
  );
}
