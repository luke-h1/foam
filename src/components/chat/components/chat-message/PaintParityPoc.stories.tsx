import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import {
  FlashList,
  type ListRenderItem,
} from '@app/components/flash-list/FlashList';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import { indexedCollectionToArray } from '@app/utils/collection/indexedCollection';
import { convertV4PaintToPaintData } from '@app/utils/seven-tv/gql/convertV4PaintToPaintData';
import { type SevenTvPaintSource } from '@app/utils/seven-tv/gql/types';

import { sevenTvPaintsFixture } from './__fixtures__/seven-tv-paints.fixture';
import { styles as chatRowStyles } from './ChatRow.styles';
import { getChatTextStyles } from './ChatText.styles';
import { PaintedUsername } from './cosmetic-username/PaintedUsername';
import { PaintedUsernameHostedLayers } from './cosmetic-username/PaintedUsernameHostedLayers';
import { PaintedUsernameSkia } from './cosmetic-username/PaintedUsernameSkia';
import { PaintedUsernameWebView } from './cosmetic-username/PaintedUsernameWebView';

const GALLERY_SIZE = 16;

const shadowPaints = sevenTvPaintsFixture
  .map(convertV4PaintToPaintData)
  .filter(paint => indexedCollectionToArray(paint.shadows).length > 0)
  .slice(0, GALLERY_SIZE);

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

function firstPaint(paints: PaintData[]): PaintData {
  const [paint] = paints;

  if (!paint) {
    throw new Error('sevenTvPaintsFixture yielded no paints for this gallery');
  }

  return paint;
}

function ComparisonRow({ paint }: { paint: PaintData }) {
  return (
    <View style={{ gap: 4, paddingBottom: 16 }}>
      <ChatText color='gray.textLow' type='subhead'>
        {paint.name}
      </ChatText>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <PaintedUsername
            isModerated={false}
            paint={paint}
            showColon={false}
            username='Preview'
          />
        </View>
        <View style={{ flex: 1 }}>
          <PaintedUsernameSkia paint={paint} username='Preview' />
        </View>
        <View style={{ flex: 1 }}>
          <PaintedUsernameWebView paint={paint} username='Preview' />
        </View>
      </View>
    </View>
  );
}

const moderatedUsernameTextStyle = [
  getChatTextStyles(undefined, 'comfortable').username,
  chatRowStyles.moderatedUsernameText,
];

/**
 * A moderated name on the hosted fill and on Skia, next to the same name not
 * moderated, so the strikethrough and the fade compare side by side.
 */
function ModeratedComparisonRow({ paint }: { paint: PaintData }) {
  return (
    <View style={{ gap: 4, paddingBottom: 16 }}>
      <ChatText color='gray.textLow' type='subhead'>
        {paint.name}
      </ChatText>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <PaintedUsernameHostedLayers
            displayUsername='Preview'
            fallbackColor='#9147FF'
            paint={paint}
            plainColor='#9147FF'
            usernameTextStyle={moderatedUsernameTextStyle}
            useWebView={false}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PaintedUsernameSkia
            paint={paint}
            username='Preview'
            fallbackColor='#9147FF'
            opacity={0.72}
            strikethrough
          />
        </View>
        <View style={{ flex: 1 }}>
          <PaintedUsernameSkia
            paint={paint}
            username='Preview'
            fallbackColor='#9147FF'
          />
        </View>
      </View>
    </View>
  );
}

function ColumnHeaders() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 12 }}>
      {['Current', 'Skia POC', 'WebView POC'].map(label => (
        <ChatText
          key={label}
          color='gray.text'
          type='subhead'
          weight='bold'
          style={{ flex: 1 }}
        >
          {label}
        </ChatText>
      ))}
    </View>
  );
}

const meta = {
  title: 'components/Chat/PaintParityPoc',
  component: ComparisonRow,
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
} satisfies Meta<typeof ComparisonRow>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderComparisonRow: ListRenderItem<PaintData> = ({ item }) => (
  <ComparisonRow paint={item} />
);

const renderModeratedComparisonRow: ListRenderItem<PaintData> = ({ item }) => (
  <ModeratedComparisonRow paint={item} />
);

function ModeratedColumnHeaders() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 12 }}>
      {['Hosted, moderated', 'Skia, moderated', 'Skia'].map(label => (
        <ChatText
          key={label}
          color='gray.text'
          type='subhead'
          weight='bold'
          style={{ flex: 1 }}
        >
          {label}
        </ChatText>
      ))}
    </View>
  );
}

function Gallery({ data }: { data: PaintData[] }) {
  return (
    <FlashList<PaintData>
      data={data}
      renderItem={renderComparisonRow}
      keyExtractor={paint => paint.id}
      ListHeaderComponent={ColumnHeaders}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

export const ShadowPaints: Story = {
  args: {
    paint: firstPaint(shadowPaints),
  },
  render: () => <Gallery data={shadowPaints} />,
};

export const AnimatedPaints: Story = {
  args: {
    paint: firstPaint(animatedPaints),
  },
  render: () => <Gallery data={animatedPaints} />,
};

const moderatedPaints = sevenTvPaintsFixture
  .slice(0, GALLERY_SIZE)
  .map(convertV4PaintToPaintData);

export const ModeratedPaints: Story = {
  args: {
    paint: firstPaint(moderatedPaints),
  },
  render: () => (
    <FlashList<PaintData>
      data={moderatedPaints}
      renderItem={renderModeratedComparisonRow}
      keyExtractor={paint => paint.id}
      ListHeaderComponent={ModeratedColumnHeaders}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  ),
};
