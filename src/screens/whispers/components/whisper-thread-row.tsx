import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Avatar } from "@app/components/avatar/avatar";
import { Text } from "@app/components/ui/text/text";
import { WhisperThread } from "@app/store/chat/types/whispers";
import { theme } from "@app/styles/themes";

interface WhisperThreadRowProps {
  onPress: (thread: WhisperThread) => void;
  thread: WhisperThread;
}

export const WhisperThreadRow = memo(function WhisperThreadRow({
  onPress,
  thread,
}: WhisperThreadRowProps) {
  const last = thread.messages.at(-1);
  const preview = last
    ? `${last.isOutgoing ? "You: " : ""}${last.body}`
    : "No messages yet";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(thread)}
      style={styles.row}
    >
      <Avatar
        uri={thread.partnerProfileImageUrl}
        name={thread.partnerDisplayName}
        size={48}
      />
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text
            type="callout"
            weight="semibold"
            numberOfLines={1}
            style={styles.name}
          >
            {thread.partnerDisplayName}
          </Text>
          {thread.unreadCount > 9 ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text type="footnote" color="gray.textLow" numberOfLines={1}>
          {preview}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: 16,
    borderCurve: "continuous",
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  name: {
    color: theme.color.text.dark,
    flex: 1,
  },
  unreadDot: {
    backgroundColor: theme.color.accent.dark,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
});
