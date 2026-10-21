import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@app/components/button/button';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';

interface ChannelFieldProps {
  channelLogin: string | null;
  channelName?: string;
  isLoading: boolean;
  isChannelMissing: boolean;
  isError: boolean;
  onChangeChannel: (login: string | null) => void;
}

/**
 * Picks the channel whose own emotes and badges join the global sets. The
 * input is uncontrolled and only commits on submit, so typing never refetches.
 */
export function ChannelField({
  channelLogin,
  channelName,
  isLoading,
  isChannelMissing,
  isError,
  onChangeChannel,
}: ChannelFieldProps) {
  const inputRef = useRef<TextInput>(null);

  const handleClear = () => {
    inputRef.current?.clear();
    onChangeChannel(null);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <SymbolView
          name='person.crop.circle'
          size={17}
          tintColor={theme.color.textSecondary.dark}
        />
        <TextInput
          ref={inputRef}
          accessibilityLabel='Channel'
          autoCapitalize='none'
          autoCorrect={false}
          spellCheck={false}
          placeholder='Add a channel'
          placeholderTextColor={theme.color.textSecondary.dark}
          returnKeyType='search'
          selectionColor={theme.colorTextSelection}
          style={styles.input}
          onSubmitEditing={event => {
            const login = normaliseChatUsername(event.nativeEvent.text);
            onChangeChannel(login || null);
          }}
        />
        {channelLogin ? (
          <Button label='Clear channel' onPress={handleClear} hitSlop={10}>
            <SymbolView
              name='xmark.circle.fill'
              size={17}
              tintColor={theme.color.textSecondary.dark}
            />
          </Button>
        ) : null}
      </View>

      {channelLogin ? (
        <Text type='footnote' color='gray.textLow' style={styles.status}>
          {getChannelStatus({
            channelLogin,
            channelName,
            isLoading,
            isChannelMissing,
            isError,
          })}
        </Text>
      ) : null}
    </View>
  );
}

interface GetChannelStatusOptions {
  channelLogin: string;
  channelName: string | undefined;
  isLoading: boolean;
  isChannelMissing: boolean;
  isError: boolean;
}

function getChannelStatus({
  channelLogin,
  channelName,
  isLoading,
  isChannelMissing,
  isError,
}: GetChannelStatusOptions) {
  if (isError) {
    return `Couldn't load ${channelLogin}. Check your connection.`;
  }

  if (isChannelMissing) {
    return `No channel called ${channelLogin}.`;
  }

  if (isLoading) {
    return `Loading ${channelLogin}…`;
  }

  return `Showing ${channelName ?? channelLogin}'s emotes and badges first.`;
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    backgroundColor: theme.colorSurfaceAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 38,
    paddingHorizontal: theme.space12,
  },
  input: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize17,
    paddingVertical: theme.space8,
  },
  status: {
    paddingHorizontal: theme.space4,
  },
  wrap: {
    gap: theme.space8,
    paddingBottom: theme.space12,
    paddingHorizontal: theme.space16,
  },
});
