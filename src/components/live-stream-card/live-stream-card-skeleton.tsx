import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@app/components/ui/skeleton/skeleton';
import { theme } from '@app/styles/themes';

/**
 * Mirrors the line boxes of `LiveStreamCard` (callout, two subhead lines,
 * footnote) so the list does not shift when data arrives.
 */
export function LiveStreamCardSkeleton({
  layout = 'compact',
}: {
  layout?: 'compact' | 'media';
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
    width: 144,
  },
  details: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  calloutLine: {
    height: 21,
    justifyContent: 'center',
  },
  subheadLine: {
    height: 20,
    justifyContent: 'center',
  },
  footnoteLine: {
    height: 18,
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
