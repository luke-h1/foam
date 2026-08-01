import { StyleSheet, type TextStyle } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import {
  resolveWeightFromFontWeight,
  Text,
  type TextWeight,
} from '@app/components/ui/Text/Text';

type FontResolution = Pick<TextStyle, 'fontFamily' | 'fontWeight'>;

function getFontResolution(text: string): FontResolution {
  const flat = StyleSheet.flatten<TextStyle>(
    screen.getByText(text).props.style,
  );
  return { fontFamily: flat.fontFamily, fontWeight: flat.fontWeight };
}

describe('resolveWeightFromFontWeight', () => {
  test('maps every theme weight to its token', () => {
    const resolved = {
      '100': resolveWeightFromFontWeight('100'),
      '200': resolveWeightFromFontWeight('200'),
      '300': resolveWeightFromFontWeight('300'),
      '400': resolveWeightFromFontWeight('400'),
      '500': resolveWeightFromFontWeight('500'),
      '600': resolveWeightFromFontWeight('600'),
      '700': resolveWeightFromFontWeight('700'),
      '800': resolveWeightFromFontWeight('800'),
      '900': resolveWeightFromFontWeight('900'),
    };

    expect(resolved).toEqual<Record<string, TextWeight>>({
      '100': 'ultralight',
      '200': 'thin',
      '300': 'light',
      '400': 'normal',
      '500': 'medium',
      '600': 'semibold',
      '700': 'bold',
      '800': 'heavy',
      '900': 'black',
    });
  });

  test('maps numeric and keyword weights', () => {
    expect(resolveWeightFromFontWeight(600)).toEqual('semibold');
    expect(resolveWeightFromFontWeight('bold')).toEqual('bold');
    expect(resolveWeightFromFontWeight('normal')).toEqual('normal');
  });

  test('clamps out-of-range and off-scale weights to the nearest token', () => {
    expect(resolveWeightFromFontWeight(50)).toEqual('ultralight');
    expect(resolveWeightFromFontWeight(450)).toEqual('medium');
    expect(resolveWeightFromFontWeight(1000)).toEqual('black');
  });

  test('returns undefined when no weight is provided', () => {
    expect(resolveWeightFromFontWeight(undefined)).toEqual(undefined);
  });
});

describe('Text', () => {
  test('resolves a style fontWeight to the matching Montserrat family', () => {
    render(<Text style={{ fontWeight: '600' }}>semibold</Text>);

    expect(getFontResolution('semibold')).toEqual<FontResolution>({
      fontFamily: 'Montserrat_600SemiBold',
      fontWeight: undefined,
    });
  });

  test('resolves a numeric style fontWeight from a style array', () => {
    render(
      <Text style={[{ fontWeight: 700 }, { letterSpacing: 0.2 }]}>bold</Text>,
    );

    expect(getFontResolution('bold')).toEqual<FontResolution>({
      fontFamily: 'Montserrat_700Bold',
      fontWeight: undefined,
    });
  });

  test('resolves the italic family when a style fontWeight meets the italic prop', () => {
    render(
      <Text italic style={{ fontWeight: '800' }}>
        heavy italic
      </Text>,
    );

    expect(getFontResolution('heavy italic')).toEqual<FontResolution>({
      fontFamily: 'Montserrat_800ExtraBold_Italic',
      fontWeight: undefined,
    });
  });

  test('keeps the weight-prop family when the style has no fontWeight', () => {
    render(<Text weight='medium'>medium</Text>);

    expect(getFontResolution('medium')).toEqual<FontResolution>({
      fontFamily: 'Montserrat_500Medium',
      fontWeight: undefined,
    });
  });

  test('renders the platform font and passes numeric fontWeight through for family system', () => {
    render(
      <Text family='system' style={{ fontWeight: '600' }}>
        system
      </Text>,
    );

    expect(getFontResolution('system')).toEqual<FontResolution>({
      fontFamily: undefined,
      fontWeight: '600',
    });
  });

  test('maps the weight prop to a numeric fontWeight for family system', () => {
    render(
      <Text family='system' weight='semibold'>
        system weight
      </Text>,
    );

    expect(getFontResolution('system weight')).toEqual<FontResolution>({
      fontFamily: undefined,
      fontWeight: '600',
    });
  });

  test('defaults maxFontSizeMultiplier to 2', () => {
    render(<Text>scaled</Text>);

    expect(screen.getByText('scaled').props.maxFontSizeMultiplier).toEqual(2);
  });

  test('allows call sites to tighten maxFontSizeMultiplier', () => {
    render(<Text maxFontSizeMultiplier={1.2}>clamped</Text>);

    expect(screen.getByText('clamped').props.maxFontSizeMultiplier).toEqual(
      1.2,
    );
  });
});
