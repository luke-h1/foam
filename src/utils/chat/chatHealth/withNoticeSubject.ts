export function withNoticeSubject(
  systemMsg: string | undefined,
  displayName: string | undefined,
): string {
  const sentence = systemMsg?.trim() ?? '';
  const subject = displayName?.trim() ?? '';

  if (!sentence || !subject) {
    return sentence;
  }

  if (sentence.toLowerCase().includes(subject.toLowerCase())) {
    return sentence;
  }

  return `${subject} ${sentence}`;
}
