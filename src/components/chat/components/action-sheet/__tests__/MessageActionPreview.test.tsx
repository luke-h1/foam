import * as paintedUsernameModule from '@app/components/chat/components/chat-message/cosmetic-username/PaintedUsername';
import render from '@app/test/render';

import { MessageActionPreview } from '../MessageActionPreview';

interface CapturedUsernameProps {
  fallbackColor?: string;
  username: string;
}

let usernameProps: CapturedUsernameProps | undefined;

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

    expect({
      fallbackColor: usernameProps?.fallbackColor,
      username: usernameProps?.username,
    }).toEqual({ fallbackColor: '#ABCDEF', username: 'luke' });
  });
});
