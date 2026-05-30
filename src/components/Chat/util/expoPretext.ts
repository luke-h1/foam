type TextStyle = {
  fontFamily: string | string[];
  fontSize: number;
  lineHeight?: number;
  fontWeight?: '400' | '500' | '600' | '700' | 'bold' | 'normal';
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number;
};

type LayoutResult = {
  height: number;
  lineCount: number;
};

export type InlineFlowItem = {
  text: string;
  style: TextStyle;
  atomic?: boolean;
  extraWidth?: number;
};

type PreparedInlineFlow = unknown;

interface ExpoPretextModule {
  prepareInlineFlow: (items: InlineFlowItem[]) => PreparedInlineFlow;
  measureInlineFlow: (
    prepared: PreparedInlineFlow,
    maxWidth: number,
    lineHeight: number,
  ) => LayoutResult;
}

const expoPretext = require('expo-pretext') as ExpoPretextModule;

export const prepareInlineFlow = expoPretext.prepareInlineFlow;
export const measureInlineFlow = expoPretext.measureInlineFlow;
export type { TextStyle };
