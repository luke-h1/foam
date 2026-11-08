import { type ColorValue, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { PressableArea } from '@app/components/pressable-area/PressableArea';
import { Text } from '@app/components/ui/text/Text';
import type { TextProps } from '@app/components/ui/text/Text.types';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

export function ChannelActivityCard({ children }: { children: ReactNode }) {
  return <View style={styles.container}>{children}</View>;
}

interface ChannelActivityHeaderProps {
  timeLabel: string | null;
  children: ReactNode;
}

export function ChannelActivityHeader({
  children,
  timeLabel,
}: ChannelActivityHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerMeta}>{children}</View>
      {timeLabel ? (
        <Text color='gray.textLow' tabular type='caption' weight='medium'>
          {timeLabel}
        </Text>
      ) : null}
    </View>
  );
}

export function ChannelActivityTitle({ children }: { children: string }) {
  return (
    <Text color='gray.text' style={styles.title} type='body' weight='semibold'>
      {children}
    </Text>
  );
}

export function ChannelActivityBars({ children }: { children: ReactNode }) {
  return <View style={styles.barList}>{children}</View>;
}

interface ChannelActivityFooterProps {
  totalLabel: string;
  channelLogin: string;

  twitchLink: { label: string; color: TextProps['color'] } | null;
}

export function ChannelActivityFooter({
  channelLogin,
  totalLabel,
  twitchLink,
}: ChannelActivityFooterProps) {
  return (
    <View style={styles.footer}>
      <Text color='gray.textLow' tabular type='caption'>
        {totalLabel}
      </Text>
      {twitchLink ? (
        <PressableArea
          onPress={() =>
            openLinkInBrowser(`https://www.twitch.tv/${channelLogin}`)
          }
        >
          <Text color={twitchLink.color} type='caption' weight='semibold'>
            {twitchLink.label}
          </Text>
        </PressableArea>
      ) : null}
    </View>
  );
}

interface ChannelActivityBarProps {
  percentage: number;
  hasVotes: boolean;
  fillColor: ColorValue;
  children: ReactNode;
}

export function ChannelActivityBar({
  children,
  fillColor,
  hasVotes,
  percentage,
}: ChannelActivityBarProps) {
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            width: `${Math.max(percentage, hasVotes ? 4 : 0)}%`,
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  barList: {
    gap: theme.space8,
  },
  container: {
    backgroundColor: theme.color.surface.dark,
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  fill: {
    borderRadius: 10,
    borderCurve: 'continuous',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space8,
  },
  title: {
    lineHeight: 20,
  },
  track: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
});
