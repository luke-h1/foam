import { useSyncExternalStore } from 'react';
import { Linking, StyleSheet, useColorScheme } from 'react-native';

import { AlertDialog, Host, Text, TextButton } from '@expo/ui/jetpack-compose';

import {
  getMediaPermissionState,
  resolveMediaPermissionPrompt,
  subscribeMediaPermission,
} from '@app/store/overlays/mediaPermissionStore';
import { theme } from '@app/styles/themes';

export function MediaPermissionHost() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
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
      colorScheme={scheme}
      style={StyleSheet.absoluteFill}
      pointerEvents='box-none'
    >
      <AlertDialog
        colors={{
          containerColor: theme.color.menu.card[scheme],
          titleContentColor: theme.color.text[scheme],
          textContentColor: theme.color.textSecondary[scheme],
        }}
        onDismissRequest={() => resolveMediaPermissionPrompt()}
      >
        <AlertDialog.Title>
          <Text
            color={theme.color.text[scheme]}
            style={{ typography: 'headlineSmall', fontWeight: '700' }}
          >
            {prompt.title}
          </Text>
        </AlertDialog.Title>
        <AlertDialog.Text>
          <Text
            color={theme.color.textSecondary[scheme]}
            style={{ typography: 'bodyMedium' }}
          >
            {prompt.message}
          </Text>
        </AlertDialog.Text>
        <AlertDialog.DismissButton>
          <TextButton
            colors={{ contentColor: theme.color.textSecondary[scheme] }}
            onClick={() => resolveMediaPermissionPrompt()}
          >
            <Text color={theme.color.textSecondary[scheme]}>
              {prompt.cancelLabel}
            </Text>
          </TextButton>
        </AlertDialog.DismissButton>
        <AlertDialog.ConfirmButton>
          <TextButton
            colors={{ contentColor: theme.color.accent[scheme] }}
            onClick={() => {
              void Linking.openSettings();
              resolveMediaPermissionPrompt();
            }}
          >
            <Text color={theme.color.accent[scheme]}>
              {prompt.settingsLabel}
            </Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
      </AlertDialog>
    </Host>
  );
}
