import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';

import { getChatTextStyles } from '../ChatText.styles';
import { getChatScale } from '../util/chatScale';

const FONT_SCALES: ChatFontScale[] = ['small', 'default', 'large'];
const DENSITIES: ChatDensity[] = ['comfortable', 'compact'];

describe('getChatScale', () => {
  test('resolves the default preference pair', () => {
    expect(getChatScale('default', 'comfortable')).toEqual({
      accentInset: 6,
      badgeSize: 18,
      bodyFontSize: 14,
      bodyLineHeight: 21,
      emoteLineHeight: 34,
      emoteSize: 30,
      gap: 4,
      gifSize: 112,
      metaIconSize: 12,
      pillPaddingVertical: 3,
      replyEmoteLineHeight: 24,
      replyEmoteSize: 20,
      rowPaddingHorizontal: 8,
      rowPaddingVertical: 5,
      secondaryFontSize: 12,
      secondaryLineHeight: 18,
      surfacePaddingHorizontal: 8,
      surfacePaddingVertical: 4,
    });
  });

  test('treats an absent font scale as the default', () => {
    expect(getChatScale(undefined, 'compact')).toEqual(
      getChatScale('default', 'compact'),
    );
  });

  test('derives body font size from the font scale alone, not density', () => {
    for (const fontScale of FONT_SCALES) {
      const comfortable = getChatScale(fontScale, 'comfortable');
      const compact = getChatScale(fontScale, 'compact');

      expect(compact.bodyFontSize).toBe(comfortable.bodyFontSize);

      expect(compact.emoteSize).toBe(comfortable.emoteSize);

      expect(compact.badgeSize).toBe(comfortable.badgeSize);

      expect(compact.secondaryFontSize).toBe(comfortable.secondaryFontSize);

      expect(compact.metaIconSize).toBe(comfortable.metaIconSize);
    }
  });

  test('sizes meta icons to the secondary text beside them', () => {
    for (const fontScale of FONT_SCALES) {
      for (const density of DENSITIES) {
        const scale = getChatScale(fontScale, density);

        expect(scale.metaIconSize).toBe(scale.secondaryFontSize);
      }
    }
  });

  test('tightens leading and row padding for compact, and nothing else', () => {
    for (const fontScale of FONT_SCALES) {
      const comfortable = getChatScale(fontScale, 'comfortable');
      const compact = getChatScale(fontScale, 'compact');

      expect(compact.bodyLineHeight).toBeLessThan(comfortable.bodyLineHeight);

      expect(compact.rowPaddingVertical).toBeLessThan(
        comfortable.rowPaddingVertical,
      );
    }
  });

  test('holds one leading ratio per density across every font scale', () => {
    for (const density of DENSITIES) {
      const ratios = FONT_SCALES.map(fontScale => {
        const scale = getChatScale(fontScale, density);
        return scale.bodyLineHeight / scale.bodyFontSize;
      });

      for (const ratio of ratios) {
        expect(ratio).toBeCloseTo(ratios[0]!, 1);
      }
    }
  });

  test('keeps the emote line tall enough for the emote it carries', () => {
    for (const fontScale of FONT_SCALES) {
      for (const density of DENSITIES) {
        const scale = getChatScale(fontScale, density);

        expect(scale.emoteLineHeight).toBeGreaterThan(scale.emoteSize);

        expect(scale.replyEmoteLineHeight).toBeGreaterThan(
          scale.replyEmoteSize,
        );
      }
    }
  });

  test('returns the identical object for repeated lookups', () => {
    expect(getChatScale('large', 'compact')).toBe(
      getChatScale('large', 'compact'),
    );
  });
});

describe('density fallback', () => {
  test('reads a missing density as comfortable', () => {
    expect(getChatScale('default', undefined)).toBe(
      getChatScale('default', 'comfortable'),
    );

    expect(getChatTextStyles('default', undefined)).toBe(
      getChatTextStyles('default', 'comfortable'),
    );
  });
});

describe('getChatTextStyles', () => {
  test('keeps the default row and notice chrome at its fixed pre-scale values', () => {
    const textStyles = getChatTextStyles('default', 'comfortable');

    expect({
      accentInset: textStyles.accentInset,
      highlightInset: textStyles.highlightInset,
      iconSpacing: textStyles.iconSpacing,
      replyToYouPill: textStyles.replyToYouPill,
      spaceBelow: textStyles.spaceBelow,
      stackGap: textStyles.stackGap,
      surface: textStyles.surface,
    }).toEqual({
      accentInset: { paddingLeft: 6 },
      highlightInset: { paddingLeft: 4 },
      iconSpacing: { marginRight: 4 },
      replyToYouPill: { paddingHorizontal: 6, paddingVertical: 3 },
      spaceBelow: { marginBottom: 4 },
      stackGap: { gap: 4 },
      surface: {
        borderLeftWidth: 2,
        marginVertical: 2,
        paddingHorizontal: 8,
        paddingVertical: 4,
      },
    });
  });

  test('scales the notice surface padding with the font scale', () => {
    expect({
      small: getChatTextStyles('small', 'comfortable').surface,
      large: getChatTextStyles('large', 'comfortable').surface,
    }).toEqual({
      small: {
        borderLeftWidth: 2,
        marginVertical: 2,
        paddingHorizontal: 7,
        paddingVertical: 3,
      },
      large: {
        borderLeftWidth: 2,
        marginVertical: 2,
        paddingHorizontal: 9,
        paddingVertical: 5,
      },
    });
  });

  test('gives secondary text one muted colour everywhere', () => {
    const textStyles = getChatTextStyles('default', 'comfortable');

    expect(textStyles.timestamp.color).toBe('#ADADB8');

    expect(textStyles.meta.color).toBe('#ADADB8');

    expect(textStyles.replyContext.color).toBe('#ADADB8');
  });

  test('renders timestamps smaller than the body, on the secondary leading', () => {
    const { timestamp } = getChatTextStyles('default', 'comfortable');

    expect({
      fontSize: timestamp.fontSize,
      lineHeight: timestamp.lineHeight,
    }).toEqual({ fontSize: 12, lineHeight: 18 });
  });

  test('bolds usernames at the body size', () => {
    const scale = getChatScale('default', 'compact');
    const textStyles = getChatTextStyles('default', 'compact');

    expect(textStyles.username.fontWeight).toBe('700');

    expect(textStyles.username.fontSize).toBe(scale.bodyFontSize);

    expect(textStyles.username.lineHeight).toBe(scale.bodyLineHeight);
  });

  test('drives row padding from the density', () => {
    expect(
      getChatTextStyles('default', 'comfortable').row.paddingVertical,
    ).toBe(5);

    expect(getChatTextStyles('default', 'compact').row.paddingVertical).toBe(2);
  });

  test('returns the identical style object for repeated lookups', () => {
    expect(getChatTextStyles('small', 'compact')).toBe(
      getChatTextStyles('small', 'compact'),
    );
  });
});
