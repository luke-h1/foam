import { render, screen } from '@testing-library/react-native';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { CheermoteRenderer } from '../CheermoteRenderer';

const mockChatInlineImage = jest.fn<null, [{ sourceUrl: string }]>();

jest.mock('../ChatInlineImage', () => ({
  ChatInlineImage: (props: { sourceUrl: string }) => mockChatInlineImage(props),
}));

function lastRenderedSourceUrl(): string | undefined {
  return mockChatInlineImage.mock.calls.at(-1)?.[0].sourceUrl;
}

function makePart(overrides?: {
  static_url?: string;
  url?: string;
}): ParsedPart<'cheermote'> {
  return {
    type: 'cheermote',
    content: 'Cheer100',
    cheermote: {
      bits: 100,
      color: '#9c3ee8',
      prefix: 'Cheer',
      static_url: overrides?.static_url ?? '',
      url: overrides?.url ?? '',
    },
  };
}

describe('CheermoteRenderer', () => {
  beforeEach(() => {
    mockChatInlineImage.mockReset();
    mockChatInlineImage.mockReturnValue(null);
  });

  test('falls back to the raw cheer token when no url resolves', () => {
    render(<CheermoteRenderer part={makePart()} />);

    expect(screen.getByText('Cheer100')).toBeOnTheScreen();
    expect(mockChatInlineImage).not.toHaveBeenCalled();
  });

  test('renders the cheermote image with the bits amount', () => {
    render(
      <CheermoteRenderer
        part={makePart({ url: 'https://cdn.example.com/cheer/100.gif' })}
      />,
    );

    expect(lastRenderedSourceUrl()).toBe('https://cdn.example.com/cheer/100.gif');
    expect(screen.getByText('100')).toBeOnTheScreen();
    expect(screen.queryByText('Cheer100')).not.toBeOnTheScreen();
  });

  test('prefers the animated url when animations are enabled', () => {
    render(
      <CheermoteRenderer
        disableAnimations={false}
        part={makePart({
          static_url: 'https://cdn.example.com/cheer/100.png',
          url: 'https://cdn.example.com/cheer/100.gif',
        })}
      />,
    );

    expect(lastRenderedSourceUrl()).toBe('https://cdn.example.com/cheer/100.gif');
  });

  test('prefers the static url when animations are disabled', () => {
    render(
      <CheermoteRenderer
        disableAnimations
        part={makePart({
          static_url: 'https://cdn.example.com/cheer/100.png',
          url: 'https://cdn.example.com/cheer/100.gif',
        })}
      />,
    );

    expect(lastRenderedSourceUrl()).toBe('https://cdn.example.com/cheer/100.png');
  });

  test('falls back to the static url when no animated url exists', () => {
    render(
      <CheermoteRenderer
        part={makePart({ static_url: 'https://cdn.example.com/cheer/100.png' })}
      />,
    );

    expect(lastRenderedSourceUrl()).toBe('https://cdn.example.com/cheer/100.png');
  });

  test('dims the container when the message is moderated', () => {
    render(
      <CheermoteRenderer
        isModerated
        part={makePart({ url: 'https://cdn.example.com/cheer/100.gif' })}
      />,
    );

    expect(screen.getByTestId('cheermote-container')).toHaveStyle({
      opacity: 0.4,
    });
  });
});
