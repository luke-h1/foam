import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

/**
 * Copies the text and shows `message` as a success toast. Empty text copies
 * nothing.
 */
export function copyWithToast(text: string | undefined, message: string) {
  if (!text) {
    return;
  }

  void Clipboard.setStringAsync(text).then(() => {
    toast.success(message);
  });
}
