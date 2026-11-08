import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

export function copyWithToast(text: string | undefined, message: string) {
  if (!text) {
    return;
  }

  void Clipboard.setStringAsync(text).then(() => {
    toast.success(message);
  });
}
