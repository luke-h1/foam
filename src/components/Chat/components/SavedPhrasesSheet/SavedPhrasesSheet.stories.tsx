import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';

import { SavedPhrasesSheet } from './SavedPhrasesSheet';

const meta = {
  title: 'components/Chat/SavedPhrasesSheet',
  component: SavedPhrasesSheet,
  decorators: [
    Story => (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: '#0E0E10',
            justifyContent: 'flex-end',
          }}
        >
          <Story />
        </View>
      </SafeAreaProvider>
    ),
  ],
  argTypes: {
    onSelectPhrase: { action: 'onSelectPhrase' },
  },
  args: {
    isPresented: false,
    onDismiss: () => {},
    onSelectPhrase: () => {},
  },
} satisfies Meta<typeof SavedPhrasesSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

type SheetProps = React.ComponentProps<typeof SavedPhrasesSheet>;

function SheetWrapper(props: Omit<SheetProps, 'isPresented' | 'onDismiss'>) {
  const [isPresented, setIsPresented] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPresented(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <SavedPhrasesSheet
        {...props}
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
      />
    </View>
  );
}

function renderSheetStory(args: SheetProps) {
  const {
    isPresented: _isPresented,
    onDismiss: _onDismiss,
    ...sheetArgs
  } = args;

  return <SheetWrapper {...sheetArgs} />;
}

export const Default: Story = {
  render: renderSheetStory,
};
