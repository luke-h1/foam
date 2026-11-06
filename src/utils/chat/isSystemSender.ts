export const SYSTEM_SENDER_LOGIN = 'system';

export function isSystemSender(sender: string | undefined): boolean {
  return sender?.toLowerCase() === SYSTEM_SENDER_LOGIN;
}
