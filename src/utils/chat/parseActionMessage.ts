const CTCP_DELIMITER = String.fromCharCode(1);
const ACTION_PREFIX = `${CTCP_DELIMITER}ACTION `;
const ACTION_SUFFIX = CTCP_DELIMITER;

export interface ParsedActionMessage {
  isAction: boolean;
  text: string;
}

export function parseActionMessage(text: string): ParsedActionMessage {
  if (
    text.length > ACTION_PREFIX.length &&
    text.startsWith(ACTION_PREFIX) &&
    text.endsWith(ACTION_SUFFIX)
  ) {
    return {
      isAction: true,
      text: text.slice(ACTION_PREFIX.length, -ACTION_SUFFIX.length),
    };
  }

  return { isAction: false, text };
}

const ACTION_COMMAND = /^\/me\s+/i;

export function parseActionCommand(input: string): ParsedActionMessage {
  const match = ACTION_COMMAND.exec(input);
  if (match) {
    return { isAction: true, text: input.slice(match[0].length) };
  }

  return { isAction: false, text: input };
}
