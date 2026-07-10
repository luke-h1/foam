import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import {
  FlashList,
  type ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { Text } from '@app/components/ui/Text/Text';
import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type { PaintData } from '@app/types/seventv/cosmetics';
import { convertV4PaintToPaintData } from '@app/utils/color/sevenTvPaintData';

import { sevenTvPaintsFixture } from './__fixtures__/sevenTvPaints.fixture';
import { PaintedUsername } from './CosmeticUsername/CosmeticUsername';
import { SkiaPaintedUsernamePoc } from './CosmeticUsername/poc/SkiaPaintedUsernamePoc';
import { WebPaintedUsernamePoc } from './CosmeticUsername/poc/WebPaintedUsernamePoc';

// Shadow-bearing paints are where the current renderer diverges most from the
// extension, so the gallery compares those. Capped because every row mounts a
// live WebView; the web column is a fidelity reference, not a list renderer.
const GALLERY_SIZE = 16;

const shadowPaints = sevenTvPaintsFixture
  .map(convertV4PaintToPaintData)
  .filter(paint => indexedCollectionToArray(paint.shadows).length > 0)
  .slice(0, GALLERY_SIZE);

function ComparisonRow({ paint }: { paint: PaintData }) {
  return (
    <View style={{ gap: 4, paddingBottom: 16 }}>
      <Text color='gray.textLow' type='xs'>
        {paint.name}
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <PaintedUsername paint={paint} showColon={false} username='Preview' />
        </View>
        <View style={{ flex: 1 }}>
          <SkiaPaintedUsernamePoc paint={paint} username='Preview' />
        </View>
        <View style={{ flex: 1 }}>
          <WebPaintedUsernamePoc paint={paint} username='Preview' />
        </View>
      </View>
    </View>
  );
}

function ColumnHeaders() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 12 }}>
      {['Current', 'Skia POC', 'WebView POC'].map(label => (
        <Text
          key={label}
          color='gray.text'
          type='xs'
          weight='bold'
          style={{ flex: 1 }}
        >
          {label}
        </Text>
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

function ShadowPaintsGallery() {
  return (
    <FlashList<PaintData>
      data={shadowPaints}
      renderItem={renderComparisonRow}
      keyExtractor={paint => paint.id}
      ListHeaderComponent={ColumnHeaders}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

export const ShadowPaints: Story = {
  args: {
    paint: shadowPaints[0] as PaintData,
  },
  render: () => <ShadowPaintsGallery />,
};
