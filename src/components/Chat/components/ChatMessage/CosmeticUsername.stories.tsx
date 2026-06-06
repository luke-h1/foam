import { sevenTvService } from '@app/services/seventv-service';
import type { PaintData } from '@app/utils/color/seventv-ws-service';
import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';
import { PaintedUsername } from './CosmeticUsername/CosmeticUsername';

const meta = {
  title: 'components/Chat/PaintedUsername',
  component: PaintedUsername,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          padding: 16,
        }}
      >
        <Story />
      </View>
    ),
  ],
  argTypes: {
    username: {
      control: 'text',
    },
    fallbackColor: {
      control: 'color',
    },
  },
} satisfies Meta<typeof PaintedUsername>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    username: 'TestUser',
    fallbackColor: '#FFFFFF',
  },
};

function AllPaintsFromApiGallery() {
  const [paints, setPaints] = useState<PaintData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    sevenTvService
      .fetchAllPaints()
      .then(result => {
        if (!cancelled) {
          setPaints(result);
        }
      })
      .catch(fetchError => {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Failed to load paints',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Text color='red' type='sm'>
        {error}
      </Text>
    );
  }

  if (!paints) {
    return <ActivityIndicator color='#FFFFFF' />;
  }

  return (
    <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
      <Text color='gray.textLow' type='xs'>
        {paints.length} paints from 7TV API
      </Text>
      {paints.map(paint => (
        <View key={paint.id} style={{ gap: 2 }}>
          <Text color='gray.textLow' type='xs'>
            {paint.name}
          </Text>
          <PaintedUsername paint={paint} showColon={false} username='Preview' />
        </View>
      ))}
    </ScrollView>
  );
}

export const AllPaintsFromApi: Story = {
  args: {
    username: 'Preview',
    showColon: false,
  },
  render: () => <AllPaintsFromApiGallery />,
};
