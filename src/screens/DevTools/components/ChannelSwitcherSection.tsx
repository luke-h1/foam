import * as Form from '@app/components/Form/Form';
import { IconSymbol } from '@app/components/IconSymbol/IconSymbol';
import { sentryService } from '@app/services/sentry-service';
import { fetchUpdateChannels } from '@app/utils/fetchUpdateChannels';
import {
  overrideUpdateURLAndHeaders,
  switchUpdateChannel,
} from '@app/utils/switchUpdateChannel';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ENV_SUPPORTS_OTA } from '../utils/envSupportsOta';

export function ChannelSwitcherSection() {
  const { theme } = useUnistyles();
  const updates = Updates.useUpdates();
  const [isSwitching, setIsSwitching] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [customChannelInput, setCustomChannelInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showURLOverride, setShowURLOverride] = useState(false);
  const [urlOverrideInput, setUrlOverrideInput] = useState('');
  const [channelOverrideInput, setChannelOverrideInput] = useState('');
  const currentChannel = Updates.channel || 'unknown';
  const currentUpdateURL = Constants.expoConfig?.updates?.url || 'unknown';

  useEffect(() => {
    setIsLoadingChannels(true);
    try {
      const fetchedChannels = fetchUpdateChannels();
      setChannels(fetchedChannels);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      setChannels([]);
    } finally {
      setIsLoadingChannels(false);
    }
  }, []);

  if (process.env.EXPO_OS === 'web') {
    return null;
  }

  if (__DEV__ && !ENV_SUPPORTS_OTA) {
    return null;
  }

  const handleSwitchChannel = (channelName: string) => {
    if (channelName === currentChannel) {
      Alert.alert(
        'Already on channel',
        `You are already on the "${channelName}" channel.`,
      );
      return;
    }

    Alert.alert(
      'Switch Update Channel',
      `Switch from "${currentChannel}" to "${channelName}" and fetch updates?\n\nAfter switching, the app will check for and fetch updates from the new channel.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch & Fetch',
          style: 'default',
          onPress: () => {
            setIsSwitching(true);
            void (async () => {
              try {
                await switchUpdateChannel(channelName, true);
                Alert.alert(
                  'Channel Switched',
                  `Successfully switched to "${channelName}" channel and checked for updates. If an update is available, you can reload the app to apply it.`,
                  [
                    {
                      text: 'OK',
                    },
                    ...(updates.isUpdatePending
                      ? [
                          {
                            text: 'Reload Now',
                            style: 'default',
                            onPress: async () => {
                              sentryService.captureMessage(
                                'OTA reload triggered after channel switch',
                                {
                                  level: 'info',
                                  tags: {
                                    category: 'ota',
                                    action: 'channel_switch_reload',
                                  },
                                },
                              );
                              await Updates.reloadAsync();
                            },
                          } as const,
                        ]
                      : []),
                  ],
                );
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : String(error);
                Alert.alert('Error', `Failed to switch channel: ${message}`);
              } finally {
                setIsSwitching(false);
              }
            })();
          },
        },
      ],
    );
  };

  const handleCustomChannel = () => {
    if (showCustomInput) {
      const channelName = customChannelInput.trim();
      if (!channelName) {
        Alert.alert('Error', 'Channel name cannot be empty');
        return;
      }

      setIsSwitching(true);
      void (async () => {
        try {
          await switchUpdateChannel(channelName, false);
          setShowCustomInput(false);
          setCustomChannelInput('');
          Alert.alert(
            'Channel Switched',
            `Successfully switched to "${channelName}" channel.`,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          Alert.alert('Error', `Failed to switch channel: ${message}`);
        } finally {
          setIsSwitching(false);
        }
      })();
    } else {
      setShowCustomInput(true);
    }
  };

  const handleURLOverride = () => {
    if (showURLOverride) {
      const url = urlOverrideInput.trim();
      if (!url) {
        Alert.alert('Error', 'Update URL cannot be empty');
        return;
      }

      if (!url.startsWith('https://')) {
        Alert.alert('Error', 'Update URL must start with https://');
        return;
      }

      Alert.alert(
        '⚠️ Security Warning',
        'This will override the update URL and disable anti-bricking measures.\n\n' +
          '⚠️ IMPORTANT:\n' +
          '• Only use this in preview builds, NOT production\n' +
          '• You MUST close and completely restart the app for this to take effect\n' +
          '• If the new update causes issues, you may need to reinstall the app\n\n' +
          'Do you want to continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Override',
            style: 'destructive',
            onPress: () => {
              setIsSwitching(true);
              try {
                const headers: Record<string, string> = {};
                if (channelOverrideInput.trim()) {
                  headers['expo-channel-name'] = channelOverrideInput.trim();
                }

                overrideUpdateURLAndHeaders(url, headers);
                setShowURLOverride(false);
                setUrlOverrideInput('');
                setChannelOverrideInput('');
                setIsSwitching(false);
                Alert.alert(
                  'URL Overridden',
                  'Update URL and headers have been overridden.\n\n' +
                    '⚠️ You MUST close the app completely and reopen it for this change to take effect.\n\n' +
                    'The app will download the new update on the next launch.',
                );
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : String(error);
                setIsSwitching(false);
                Alert.alert('Error', `Failed to override URL: ${message}`);
              }
            },
          },
        ],
      );
    } else {
      setShowURLOverride(true);
    }
  };

  const getChannelHint = (channel: string) => {
    if (channel === currentChannel) {
      return (
        <IconSymbol
          name="checkmark.circle.fill"
          color={theme.colors.blue.accent}
        />
      );
    }

    if (isSwitching) {
      return <ActivityIndicator animating size="small" />;
    }
    return (
      <IconSymbol name="arrow.right.circle" color={theme.colors.gray.textLow} />
    );
  };

  const getChannelColor = (channel: string) => {
    if (channel === currentChannel) {
      return theme.colors.blue.accent;
    }
    if (isSwitching) {
      return theme.colors.gray.textLow;
    }
    return theme.colors.gray.text;
  };

  return (
    <>
      <Form.Section
        title="Update Channel"
        titleHint={
          isSwitching ? (
            <ActivityIndicator animating size="small" />
          ) : (
            currentChannel
          )
        }
      >
        <Form.Text hint={currentChannel}>Current channel</Form.Text>
        <Form.Text hint={currentUpdateURL}>Current URL</Form.Text>

        {isLoadingChannels ? (
          <Form.Text hint={<ActivityIndicator animating size="small" />}>
            Loading channels...
          </Form.Text>
        ) : (
          channels.map(channel => (
            <Form.Text
              key={channel}
              style={{ color: getChannelColor(channel) }}
              onPress={() => {
                if (!isSwitching) {
                  void handleSwitchChannel(channel);
                }
              }}
              hint={getChannelHint(channel)}
            >
              {channel}
            </Form.Text>
          ))
        )}

        {showCustomInput ? (
          <KeyboardAvoidingView behavior="padding">
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.textInput}
                value={customChannelInput}
                onChangeText={setCustomChannelInput}
                placeholder="Enter channel name"
                placeholderTextColor={theme.colors.gray.textLow}
                autoFocus
                editable={!isSwitching}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Form.HStack style={styles.customInputButtons}>
                <Form.Text
                  style={{
                    color: isSwitching
                      ? theme.colors.gray.textLow
                      : theme.colors.blue.accent,
                  }}
                  onPress={handleCustomChannel}
                  hint={
                    isSwitching ? (
                      <ActivityIndicator animating size="small" />
                    ) : (
                      <IconSymbol
                        name="checkmark.circle"
                        color={theme.colors.blue.accent}
                      />
                    )
                  }
                >
                  Switch
                </Form.Text>
                <Form.Text
                  style={{
                    color: isSwitching
                      ? theme.colors.gray.textLow
                      : theme.colors.gray.text,
                  }}
                  onPress={() => {
                    setShowCustomInput(false);
                    setCustomChannelInput('');
                  }}
                  hint={
                    <IconSymbol
                      name="xmark.circle"
                      color={theme.colors.gray.textLow}
                    />
                  }
                >
                  Cancel
                </Form.Text>
              </Form.HStack>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <Form.Text
            style={{
              color: isSwitching
                ? theme.colors.gray.textLow
                : theme.colors.gray.text,
            }}
            onPress={() => {
              if (!isSwitching) {
                handleCustomChannel();
              }
            }}
            hint={
              isSwitching ? (
                <ActivityIndicator animating size="small" />
              ) : (
                <IconSymbol
                  name="plus.circle"
                  color={theme.colors.gray.textLow}
                />
              )
            }
          >
            Custom channel...
          </Form.Text>
        )}
      </Form.Section>

      <Form.Section
        title="Override Update URL"
        titleHint={
          showURLOverride ? (
            <Form.Text style={styles.warningHint}>⚠️ Preview only</Form.Text>
          ) : undefined
        }
      >
        {showURLOverride ? (
          <KeyboardAvoidingView behavior="padding">
            <Form.Text style={styles.warningText}>
              ⚠️ Requires app restart. Only use in preview builds.
            </Form.Text>
            <View style={styles.urlOverrideInputs}>
              <TextInput
                style={styles.textInput}
                value={urlOverrideInput}
                onChangeText={setUrlOverrideInput}
                placeholder="https://u.expo.dev/{projectId}/group/{groupId}"
                placeholderTextColor={theme.colors.gray.textLow}
                autoFocus
                editable={!isSwitching}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TextInput
                style={[styles.textInput, styles.channelInput]}
                value={channelOverrideInput}
                onChangeText={setChannelOverrideInput}
                placeholder="Channel name (optional)"
                placeholderTextColor={theme.colors.gray.textLow}
                editable={!isSwitching}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Form.HStack style={styles.urlOverrideButtons}>
              <Form.Text
                style={{
                  color: isSwitching
                    ? theme.colors.gray.textLow
                    : theme.colors.red.accent,
                }}
                onPress={handleURLOverride}
                hint={
                  isSwitching ? (
                    <ActivityIndicator animating size="small" />
                  ) : (
                    <IconSymbol
                      name="checkmark.circle"
                      color={theme.colors.red.accent}
                    />
                  )
                }
              >
                Override
              </Form.Text>
              <Form.Text
                style={{
                  color: isSwitching
                    ? theme.colors.gray.textLow
                    : theme.colors.gray.text,
                }}
                onPress={() => {
                  setShowURLOverride(false);
                  setUrlOverrideInput('');
                  setChannelOverrideInput('');
                }}
                hint={
                  <IconSymbol
                    name="xmark.circle"
                    color={theme.colors.gray.textLow}
                  />
                }
              >
                Cancel
              </Form.Text>
            </Form.HStack>
          </KeyboardAvoidingView>
        ) : (
          <Form.Text
            style={{
              color: isSwitching
                ? theme.colors.gray.textLow
                : theme.colors.red.accent,
            }}
            onPress={() => {
              if (!isSwitching) {
                handleURLOverride();
              }
            }}
            hint={
              isSwitching ? (
                <ActivityIndicator animating size="small" />
              ) : (
                <IconSymbol
                  name="exclamationmark.triangle"
                  color={theme.colors.red.accent}
                />
              )
            }
          >
            Override Update URL...
          </Form.Text>
        )}
      </Form.Section>
    </>
  );
}

const styles = StyleSheet.create(theme => ({
  customInputContainer: {
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.font.fontSize.sm,
    color: theme.colors.gray.text,
    backgroundColor: theme.colors.gray.bgAltAlpha,
    minHeight: 44,
  },
  customInputButtons: {
    justifyContent: 'flex-end',
  },
  urlOverrideInputs: {
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  channelInput: {
    marginTop: 0,
  },
  urlOverrideButtons: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  warningText: {
    color: theme.colors.red.accent,
    fontSize: theme.font.fontSize.xxs,
  },
  warningHint: {
    color: theme.colors.red.accent,
    fontSize: theme.font.fontSize.xxs,
  },
}));
