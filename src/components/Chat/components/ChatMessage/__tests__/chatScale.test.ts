import {
  CHAT_SURFACE_COLORS,
  type ChatDensity,
  type ChatFontScale,
  densityFromCompact,
  getChatScale,
} from '../chatScale';
import { getChatTextStyles } from '../chatText.styles';

const FONT_SCALES: ChatFontScale[] = ['small', 'default', 'large'];
const DENSITIES: ChatDensity[] = ['comfortable', 'compact'];

describe('getChatScale', () => {
  test('resolves the default preference pair', () => {
    expect(getChatScale('default', 'comfortable')).toEqual({
      badgeGap: 4,
      badgeSize: 18,
      bodyFontSize: 14,
      bodyLineHeight: 21,
      emoteLineHeight: 34,
      emoteSize: 30,
      gap: 4,
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

describe('densityFromCompact', () => {
  test('maps the compact flag onto a density', () => {
    expect(densityFromCompact(true)).toBe('compact');
    expect(densityFromCompact(false)).toBe('comfortable');
    expect(densityFromCompact(undefined)).toBe('comfortable');
  });
});

describe('getChatTextStyles', () => {
  test('gives secondary text one muted colour everywhere', () => {
    const textStyles = getChatTextStyles('default', false);

    expect(textStyles.timestamp.color).toBe(CHAT_SURFACE_COLORS.muted);
    expect(textStyles.meta.color).toBe(CHAT_SURFACE_COLORS.muted);
    expect(textStyles.replyContext.color).toBe(CHAT_SURFACE_COLORS.muted);
  });

  test('renders timestamps smaller than the body but on the same leading', () => {
    const scale = getChatScale('default', 'comfortable');
    const textStyles = getChatTextStyles('default', false);

    expect(textStyles.timestamp.fontSize).toBe(scale.secondaryFontSize);
    expect(textStyles.timestamp.fontSize).toBeLessThan(scale.bodyFontSize);
  });

  test('bolds usernames at the body size', () => {
    const scale = getChatScale('default', 'compact');
    const textStyles = getChatTextStyles('default', true);

    expect(textStyles.username.fontWeight).toBe('700');
    expect(textStyles.username.fontSize).toBe(scale.bodyFontSize);
    expect(textStyles.username.lineHeight).toBe(scale.bodyLineHeight);
  });

  test('drives row padding from the density', () => {
    expect(getChatTextStyles('default', false).row.paddingVertical).toBe(5);
    expect(getChatTextStyles('default', true).row.paddingVertical).toBe(2);
  });

  test('returns the identical style object for repeated lookups', () => {
    expect(getChatTextStyles('small', true)).toBe(
      getChatTextStyles('small', true),
    );
  });
});
