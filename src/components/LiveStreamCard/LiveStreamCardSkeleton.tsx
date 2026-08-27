import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { theme } from '@app/styles/themes';

export function LiveStreamCardSkeleton({
  layout = 'compact',
}: {
  layout?: 'compact' | 'media';
}) {
  if (layout === 'media') {
    return (
      <View style={styles.mediaContainer} testID='stream-skeleton'>
        <Skeleton style={styles.mediaImageSkeleton} />
        <View style={styles.mediaDetailsRow}>
          <Skeleton style={styles.avatarSkeleton} />
          <View style={styles.mediaTextColumn}>
            <View style={styles.mediaUsernameLine}>
              <Skeleton style={styles.usernameSkeleton} />
            </View>
            <View style={styles.mediaTitleLine}>
              <Skeleton style={styles.titleSkeleton} />
            </View>
            <View style={styles.mediaCategoryLine}>
              <Skeleton style={styles.categoryLineSkeleton} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID='stream-skeleton'>
      <View style={styles.imageContainer}>
        <Skeleton style={styles.imageSkeleton} />
      </View>

      <View style={styles.details}>
        <View style={styles.usernameLine}>
          <Skeleton style={styles.usernameSkeleton} />
        </View>
        <View style={styles.titleLine}>
          <Skeleton style={styles.titleSkeleton} />
        </View>
        <View style={styles.metadataLine}>
          <Skeleton style={styles.metaTextSkeleton} />
          <Skeleton style={styles.metaDividerSkeleton} />
          <Skeleton style={styles.metaWideSkeleton} />
        </View>
        <View style={styles.categoryLine}>
          <Skeleton style={styles.categoryLineSkeleton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSkeleton: {
    borderRadius: theme.borderRadius999,
    height: 44,
    marginTop: 2,
    width: 44,
  },
  categoryLine: {
    height: 16,
    justifyContent: 'center',
  },
  categoryLineSkeleton: {
    height: 12,
    width: 88,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: 'rgba(255,255,255,0.13)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginHorizontal: theme.space16,
    marginVertical: theme.space4,
    minHeight: 112,
    overflow: 'hidden',
    paddingHorizontal: theme.space8,
    paddingVertical: theme.space8,
  },
  details: {
    flex: 1,
    gap: theme.space2,
    justifyContent: 'flex-start',
    minHeight: 88,
    minWidth: 0,
  },
  imageContainer: {
    marginRight: theme.space12,
  },
  imageSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    height: 88,
    width: 132,
  },
  mediaCategoryLine: {
    height: 20,
    justifyContent: 'center',
  },
  mediaContainer: {
    marginHorizontal: theme.space16,
    marginVertical: theme.space12,
  },
  mediaDetailsRow: {
    flexDirection: 'row',
    gap: theme.space12,
    marginTop: theme.space12,
  },
  mediaImageSkeleton: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius8,
    width: '100%',
  },
  mediaTextColumn: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  mediaTitleLine: {
    height: 19,
    justifyContent: 'center',
  },
  mediaUsernameLine: {
    height: 21,
    justifyContent: 'center',
  },
  metaDividerSkeleton: {
    borderRadius: theme.borderRadius999,
    height: 8,
    width: 8,
  },
  metadataLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    height: 20,
    marginTop: theme.space4,
  },
  metaTextSkeleton: {
    height: 12,
    width: 48,
  },
  metaWideSkeleton: {
    height: 12,
    width: 96,
  },
  titleLine: {
    height: 19,
    justifyContent: 'center',
  },
  titleSkeleton: {
    height: 13,
    width: '72%',
  },
  usernameLine: {
    height: 24,
    justifyContent: 'center',
  },
  usernameSkeleton: {
    height: 14,
    width: 96,
  },
});
