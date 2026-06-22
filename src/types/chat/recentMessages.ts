export type ParsedIrcMessage = {
  tags?: Record<string, string>;
  prefix?: string;
  command: string;
  params: string[];
};
