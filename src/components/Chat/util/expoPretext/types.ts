export type TextStyle = {
  fontFamily: string | string[];
  fontSize: number;
  lineHeight?: number;
  fontWeight?: '400' | '500' | '600' | '700' | 'bold' | 'normal';
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number;
};

export type InlineFlowItem = {
  text: string;
  style: TextStyle;
  atomic?: boolean;
  extraWidth?: number;
};
