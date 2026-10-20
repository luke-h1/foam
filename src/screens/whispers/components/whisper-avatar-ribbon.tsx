import { Avatar } from "@app/components/avatar/avatar";
import { Text } from "@app/components/ui/text/text";
import { WhisperThread } from "@app/store/chat/types/whispers";
import { theme } from "@app/styles/themes";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface WhisperAvatarRibbonProps {
  onPress: (thread: WhisperThread) => void;
  threads: WhisperThread[];
}

export const WhisperAvatarRibbon = memo(function WhisperAvatarRibbon({
  onPress,
  threads,
}: WhisperAvatarRibbonProps) {
  const renderItem = useCallback<ListRenderItem<WhisperThread>>(
    ({ item: thread }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={thread.partnerDisplayName}
        onPress={() => onPress(thread)}
        style={styles.item}
      >
        <Avatar
          uri={thread.partnerProfileImageUrl}
          name={thread.partnerDisplayName}
          size={56}
        />
        <Text type="caption2" numberOfLines={1} style={styles.name}>
          {thread.partnerDisplayName}
        </Text>

        {thread.unreadCount > 0 ? <View style={styles.unread} /> : null}
      </Pressable>
    ),
    [onPress],
  );

  if (threads.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text type="footnote" weight="semibold" style={styles.label}>
        Your circle
      </Text>
      <FlashList
        data={threads}
        keyExtractor={(item) => item.partnerLogin}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        renderItem={renderItem}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    gap: 6,
    width: 64,
  },
  name: {
    color: theme.color.text.dark,
    textAlign: "center",
    width: "100%",
  },
  row: {
    gap: 14,
    paddingHorizontal: 16,
  },
  unread: {
    backgroundColor: theme.color.accent.dark,
    borderRadius: 999,
    height: 8,
    position: "absolute",
    right: 6,
    top: 2,
    width: 8,
  },
  wrap: {
    gap: 10,
    paddingBottom: 8,
    paddingTop: 4,
  },
  label: {
    color: theme.color.textSecondary.dark,
    paddingHorizontal: 16,
  },
});
