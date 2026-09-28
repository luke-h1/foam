import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import {
  FlashList,
  type ListRenderItem,
} from '@app/components/flash-list/flash-list';
import { Text } from '@app/components/ui/text/text';
import type { PaintData } from '@app/types/seventv/cosmetics';
import { convertV4PaintToPaintData } from '@app/utils/color/seven-tv-paint-data/convert-v4-paint-to-paint-data';
import { type SevenTvPaintSource } from '@app/utils/color/seven-tv-paint-data/types';

import { sevenTvPaintsFixture } from './__fixtures__/seven-tv-paints.fixture';
import { PaintedUsername } from './cosmetic-username/painted-username';

// A paint is animated when it has an image layer with a multi-frame texture.
// frameCount only survives on the raw fixture (conversion drops it), so classify
// before converting. Refresh the offline snapshot with `bun gen:paints`.
function isAnimatedPaint(paint: SevenTvPaintSource): boolean {
  return paint.data.layers.some(
    layer =>
      layer.ty.__typename === 'PaintLayerTypeImage' &&
      layer.ty.images.some(image => image.frameCount > 1),
  );
}

const animatedPaints = sevenTvPaintsFixture
  .filter(isAnimatedPaint)
  .map(convertV4PaintToPaintData);

const staticPaints = sevenTvPaintsFixture
  .filter(paint => !isAnimatedPaint(paint))
  .map(convertV4PaintToPaintData);

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

type GalleryRow =
  | { kind: 'header'; title: string; count: number }
  | { kind: 'paint'; paint: PaintData };

const galleryRows: GalleryRow[] = [
  { kind: 'header', title: 'Animated', count: animatedPaints.length },
  ...animatedPaints.map(paint => ({ kind: 'paint' as const, paint })),
  { kind: 'header', title: 'Static', count: staticPaints.length },
  ...staticPaints.map(paint => ({ kind: 'paint' as const, paint })),
];

const renderGalleryRow: ListRenderItem<GalleryRow> = ({ item }) => {
  if (item.kind === 'header') {
    return (
      <Text
        color='gray.text'
        type='sm'
        weight='bold'
        style={{ paddingTop: 16, paddingBottom: 4 }}
      >
        {item.title} ({item.count})
      </Text>
    );
  }

  return (
    <View style={{ gap: 2, paddingBottom: 10 }}>
      <Text color='gray.textLow' type='xs'>
        {item.paint.name}
      </Text>
      <PaintedUsername
        paint={item.paint}
        showColon={false}
        username='Preview'
      />
    </View>
  );
};

function AllPaintsGallery() {
  return (
    <FlashList<GalleryRow>
      data={galleryRows}
      renderItem={renderGalleryRow}
      keyExtractor={item =>
        item.kind === 'header' ? `header-${item.title}` : item.paint.id
      }
      getItemType={item => item.kind}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

export const AllPaints: Story = {
  args: {
    username: 'Preview',
    showColon: false,
  },
  render: () => <AllPaintsGallery />,
};
