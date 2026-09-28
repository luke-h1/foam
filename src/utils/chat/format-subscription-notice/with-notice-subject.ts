function mentionsSubject(sentence: string, subject: string): boolean {
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}_])${subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}_]|$)`,
    'iu',
  );

  return pattern.test(sentence);
}

export function withNoticeSubject(
  systemMsg: string | undefined,
  displayName: string | undefined,
): string {
  const sentence = systemMsg?.trim() ?? '';
  const subject = displayName?.trim() ?? '';

  if (!sentence || !subject) {
    return sentence;
  }

  if (mentionsSubject(sentence, subject)) {
    return sentence;
  }

  return `${subject} ${sentence}`;
}
