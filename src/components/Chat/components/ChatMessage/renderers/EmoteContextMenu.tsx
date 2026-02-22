import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import * as Clipboard from 'expo-clipboard';
import { ReactNode } from 'react';
import { toast } from 'sonner-native';
import * as ContextMenu from 'zeego/context-menu';

type PartVariant = ParsedPart<'emote'>;

interface EmoteContextMenuProps {
  part: PartVariant;
  onPress?: (part: PartVariant) => void;
  children: ReactNode;
}

/**
 * Wraps an emote with a zeego context menu (long-press): copy name, copy image URL, preview.
 */
export function EmoteContextMenu({
  part,
  onPress,
  children,
}: EmoteContextMenuProps) {
  const copyName = () => {
    const text = part.name ?? part.original_name ?? '';
    if (!text) return;
    void Clipboard.setStringAsync(text).then(() => {
      toast.success('Emote name copied to clipboard');
    });
  };

  const copyImageUrl = () => {
    if (!part.url) return;
    void Clipboard.setStringAsync(part.url).then(() => {
      toast.success('Emote URL copied to clipboard');
    });
  };

  const handlePreview = () => {
    onPress?.(part);
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item key="copy-name" onSelect={copyName}>
          <ContextMenu.ItemTitle>Copy name</ContextMenu.ItemTitle>
        </ContextMenu.Item>
        {part.url ? (
          <ContextMenu.Item key="copy-url" onSelect={copyImageUrl}>
            <ContextMenu.ItemTitle>Copy image URL</ContextMenu.ItemTitle>
          </ContextMenu.Item>
        ) : null}
        {onPress ? (
          <ContextMenu.Item key="preview" onSelect={handlePreview}>
            <ContextMenu.ItemTitle>Preview</ContextMenu.ItemTitle>
          </ContextMenu.Item>
        ) : null}
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
