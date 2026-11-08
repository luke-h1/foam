import type { TextStyle } from 'react-native';

import * as paintedUsernameModule from '@app/components/chat/components/chat-message/cosmetic-username/PaintedUsername';
import render from '@app/test/render';

import { MessageActionPreview } from '../MessageActionPreview';

interface CapturedUsernameProps {
  fallbackColor?: string;
  isModerated: boolean;
  username: string;
  usernameTextStyle: TextStyle;
}

let usernameProps: CapturedUsernameProps | undefined;

/**
 * PaintedUsername is memo()-wrapped, so spyOn refuses to patch it.
 */
Object.defineProperty(paintedUsernameModule, 'PaintedUsername', {
  configurable: true,
  value: (props: CapturedUsernameProps) => {
    usernameProps = props;
    return null;
  },
});

describe('MessageActionPreview', () => {
  test('colours the sender with the colour the chat row used', () => {
    render(
      <MessageActionPreview
        message={[{ type: 'text', content: 'hello' }]}
        username='luke'
        usernameColor='#ABCDEF'
      />,
    );

    expect(usernameProps).toEqual<CapturedUsernameProps>({
      fallbackColor: '#ABCDEF',
      isModerated: false,
      username: 'luke',
      usernameTextStyle: { fontSize: 16, lineHeight: 22 },
    });
  });
});
