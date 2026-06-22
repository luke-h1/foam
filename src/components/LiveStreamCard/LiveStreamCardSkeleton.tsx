import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { theme } from '@app/styles/themes';

export function LiveStreamCardSkeleton({
  layout = 'compact',
}: {
  layout?: 'compact' | 'media';
}) {
  const isMediaLayout = layout === 'media';
  const imageStyle = isMediaLayout
    ? { ...styles.imageSkeleton, ...styles.imageMedia }
    : styles.imageSkeleton;

  return (
    <View
      style={[styles.container, isMediaLayout && styles.containerMedia]}
      testID='stream-skeleton'
    >
      <View style={styles.imageContainer}>
        <Skeleton style={imageStyle} />
      </View>

      <View style={styles.details}>
        <View style={styles.headerRow}>
          <Skeleton style={styles.usernameSkeleton} />
        </View>
        <Skeleton style={styles.titleSkeleton} />
        <View style={styles.metadata}>
          <View style={styles.info}>
            <Skeleton style={styles.metaTextSkeleton} />
            <Skeleton style={styles.metaDividerSkeleton} />
            <Skeleton style={styles.metaWideSkeleton} />
          </View>
        </View>
        <Skeleton style={styles.categoryLineSkeleton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryLineSkeleton: {
    borderRadius: theme.borderRadius12,
    height: 20,
    width: 88,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: 'rgba(255,255,255,0.13)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    borderWidth: 1,
    columnGap: theme.space12,
    flexDirection: 'row',
    marginHorizontal: theme.space16,
    marginVertical: 5,
    minHeight: 112,
    overflow: 'hidden',
    paddingHorizontal: theme.space12,
    paddingVertical: 10,
  },
  containerMedia: {
    minHeight: 124,
  },
  details: {
    flex: 1,
    gap: 6,
    justifyContent: 'flex-start',
    minHeight: 76,
    minWidth: 0,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
  },
  imageContainer: {
    position: 'relative',
  },
  imageMedia: {
    height: 98,
    width: 164,
  },
  imageSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    height: 88,
    width: 132,
  },
  info: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
  },
  metaDividerSkeleton: {
    borderRadius: theme.borderRadius999,
    height: 10,
    width: 10,
  },
  metadata: {
    marginVertical: theme.space8,
  },
  metaTextSkeleton: {
    height: 12,
    width: 48,
  },
  metaWideSkeleton: {
    height: 12,
    width: 96,
  },
  titleSkeleton: {
    height: 18,
    width: '72%',
  },
  usernameSkeleton: {
    height: 14,
    width: 74,
  },
});
