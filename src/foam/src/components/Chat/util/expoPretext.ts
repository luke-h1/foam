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

type PreparedTextWithSegments = unknown;

interface ExpoPretextModule {
  prepareInlineFlow: (items: InlineFlowItem[]) => PreparedInlineFlow;
  measureInlineFlow: (
    prepared: PreparedInlineFlow,
    maxWidth: number,
    lineHeight: number,
  ) => LayoutResult;
  prepareWithSegments: (
    text: string,
    style: TextStyle,
  ) => PreparedTextWithSegments;
  measureNaturalWidth: (prepared: PreparedTextWithSegments) => number;
}

const expoPretext = require('expo-pretext') as ExpoPretextModule;

export const prepareInlineFlow = expoPretext.prepareInlineFlow;
export const measureInlineFlow = expoPretext.measureInlineFlow;
export const prepareWithSegments = expoPretext.prepareWithSegments;
export const measureNaturalWidth = expoPretext.measureNaturalWidth;
export type { TextStyle };
