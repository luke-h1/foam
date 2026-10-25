import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import {
  FlashList,
  type ListRenderItem,
} from '@app/components/flash-list/FlashList';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import { convertV4PaintToPaintData } from '@app/utils/color/seven-tv-paint-data/convertV4PaintToPaintData';
import { type SevenTvPaintSource } from '@app/utils/color/seven-tv-paint-data/types';

import { sevenTvPaintsFixture } from './__fixtures__/seven-tv-paints.fixture';
import { PaintedUsername } from './cosmetic-username/PaintedUsername';
import { PaintedUsernameSkia } from './cosmetic-username/PaintedUsernameSkia';
import { chatLineMetrics } from './util/chatScale';

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
  | { kind: 'paint'; paint: PaintData; animated: boolean };

const galleryRows: GalleryRow[] = [
  { kind: 'header', title: 'Animated, Skia', count: animatedPaints.length },
  ...animatedPaints.map(paint => ({
    kind: 'paint' as const,
    paint,
    animated: true,
  })),
  { kind: 'header', title: 'Static', count: staticPaints.length },
  ...staticPaints.map(paint => ({
    kind: 'paint' as const,
    paint,
    animated: false,
  })),
];

function SkiaPaintName({
  paint,
  username,
}: {
  paint: PaintData;
  username: string;
}) {
  return (
    <PaintedUsernameSkia
      fallbackColor='#FFFFFF'
      fontSize={chatLineMetrics.comfortable.fontSize}
      lineHeight={chatLineMetrics.comfortable.lineHeight}
      paint={paint}
      username={username}
    />
  );
}

const renderGalleryRow: ListRenderItem<GalleryRow> = ({ item }) => {
  if (item.kind === 'header') {
    return (
      <ChatText
        color='gray.text'
        type='body'
        weight='bold'
        style={{ paddingTop: 16, paddingBottom: 4 }}
      >
        {item.title} ({item.count})
      </ChatText>
    );
  }

  return (
    <View style={{ gap: 2, paddingBottom: 10 }}>
      <ChatText color='gray.textLow' type='subhead'>
        {item.paint.name}
      </ChatText>
      {item.animated ? (
        <SkiaPaintName paint={item.paint} username='Preview' />
      ) : (
        <PaintedUsername
          paint={item.paint}
          showColon={false}
          username='Preview'
        />
      )}
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
      getItemType={item => {
        if (item.kind === 'header') {
          return 'header';
        }

        return item.animated ? 'animated' : 'static';
      }}
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

const animatedPreviewNames = ['Lu', 'FoamPreview'] as const;

function AnimatedPaintRow({ paint }: { paint: PaintData }) {
  return (
    <View style={{ gap: 4, paddingBottom: 14 }}>
      <ChatText color='gray.textLow' type='subhead'>
        {paint.name}
      </ChatText>
      {animatedPreviewNames.map(username => (
        <SkiaPaintName key={username} paint={paint} username={username} />
      ))}
    </View>
  );
}

const renderAnimatedRow: ListRenderItem<PaintData> = ({ item }) => (
  <AnimatedPaintRow paint={item} />
);

function AnimatedPaintHeader() {
  return (
    <ChatText
      color='gray.text'
      type='body'
      weight='bold'
      style={{ paddingBottom: 8 }}
    >
      {animatedPaints.length} animated paints from the 7TV catalog
    </ChatText>
  );
}

function AnimatedPaintGallery() {
  return (
    <FlashList<PaintData>
      data={animatedPaints}
      renderItem={renderAnimatedRow}
      keyExtractor={paint => paint.id}
      ListHeaderComponent={AnimatedPaintHeader}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

export const Animated: Story = {
  args: {
    username: 'FoamPreview',
    showColon: false,
  },
  render: () => <AnimatedPaintGallery />,
};
