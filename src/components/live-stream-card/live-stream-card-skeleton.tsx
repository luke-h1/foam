import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Skeleton } from '@app/components/ui/skeleton/skeleton';
import { theme } from '@app/styles/themes';

type StreamListLayout = 'compact' | 'media';

const THUMBNAIL_WIDTH = 144;
const LINE_GAP = 2;
const CALLOUT_LINE_HEIGHT = 21;
const SUBHEAD_LINE_HEIGHT = 20;
const FOOTNOTE_LINE_HEIGHT = 18;

const TEXT_LINES_HEIGHT =
  CALLOUT_LINE_HEIGHT +
  SUBHEAD_LINE_HEIGHT * 2 +
  FOOTNOTE_LINE_HEIGHT +
  LINE_GAP * 3;

function getSkeletonRowHeight(layout: StreamListLayout, width: number) {
  if (layout === 'media') {
    const imageHeight = ((width - theme.space16 * 2) * 9) / 16;

    return theme.space12 * 3 + imageHeight + TEXT_LINES_HEIGHT;
  }

  return (
    theme.space8 * 2 + Math.max((THUMBNAIL_WIDTH * 9) / 16, TEXT_LINES_HEIGHT)
  );
}

/**
 * Enough skeleton rows to fill the window, so the loading list has no empty
 * gap at the bottom on a tall screen.
 */
export function LiveStreamCardSkeletons({
  layout,
}: {
  layout: StreamListLayout;
}) {
  const { height, width } = useWindowDimensions();
  const count = Math.ceil(height / getSkeletonRowHeight(layout, width));

  return Array.from({ length: count }, (_, index) => (
    <LiveStreamCardSkeleton key={index} layout={layout} />
  ));
}

/**
 * Mirrors the line boxes of `LiveStreamCard` (callout, two subhead lines,
 * footnote) so the list does not shift when data arrives.
 */
export function LiveStreamCardSkeleton({
  layout = 'compact',
}: {
  layout?: StreamListLayout;
}) {
  if (layout === 'media') {
    return (
      <View style={styles.mediaCard} testID='stream-skeleton'>
        <Skeleton style={styles.mediaImage} />
        <View style={styles.mediaDetailsRow}>
          <Skeleton style={styles.avatar} />
          <TextLines />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row} testID='stream-skeleton'>
      <Skeleton style={styles.thumbnail} />
      <TextLines />
    </View>
  );
}

function TextLines() {
  return (
    <View style={styles.details}>
      <View style={styles.calloutLine}>
        <Skeleton style={styles.name} />
      </View>
      <View style={styles.subheadLine}>
        <Skeleton style={styles.titleLong} />
      </View>
      <View style={styles.subheadLine}>
        <Skeleton style={styles.titleShort} />
      </View>
      <View style={styles.footnoteLine}>
        <Skeleton style={styles.meta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  thumbnail: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    width: THUMBNAIL_WIDTH,
  },
  details: {
    flex: 1,
    gap: LINE_GAP,
    minWidth: 0,
  },
  calloutLine: {
    height: CALLOUT_LINE_HEIGHT,
    justifyContent: 'center',
  },
  subheadLine: {
    height: SUBHEAD_LINE_HEIGHT,
    justifyContent: 'center',
  },
  footnoteLine: {
    height: FOOTNOTE_LINE_HEIGHT,
    justifyContent: 'center',
  },
  name: {
    height: 13,
    width: 96,
  },
  titleLong: {
    height: 11,
    width: '88%',
  },
  titleShort: {
    height: 11,
    width: '56%',
  },
  meta: {
    height: 10,
    width: 112,
  },
  mediaCard: {
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  mediaImage: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    width: '100%',
  },
  mediaDetailsRow: {
    flexDirection: 'row',
    gap: theme.space12,
    marginTop: theme.space12,
  },
  avatar: {
    borderRadius: theme.radius.full,
    height: 36,
    width: 36,
  },
});
