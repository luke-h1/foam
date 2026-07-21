import { StyleSheet, useColorScheme, View } from 'react-native';

import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { theme } from '@app/styles/themes';

export function LiveStreamCardSkeleton({
  layout = 'compact',
}: {
  layout?: 'compact' | 'media';
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  if (layout === 'media') {
    return (
      <View style={styles.mediaContainer} testID='stream-skeleton'>
        <Skeleton style={styles.mediaImageSkeleton} />
        <View style={styles.mediaDetailsRow}>
          <Skeleton style={styles.mediaAvatarSkeleton} />
          <View style={styles.mediaTextColumn}>
            <Skeleton style={styles.usernameSkeleton} />
            <Skeleton style={styles.titleSkeleton} />
            <Skeleton style={styles.categoryLineSkeleton} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.color.surface[scheme],
          borderColor: theme.color.border[scheme],
        },
      ]}
      testID='stream-skeleton'
    >
      <View style={styles.imageContainer}>
        <Skeleton style={styles.imageSkeleton} />
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: StyleSheet.hairlineWidth,
    columnGap: theme.space12,
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
    gap: theme.space8,
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
  mediaAvatarSkeleton: {
    borderRadius: theme.borderRadius999,
    height: 44,
    width: 44,
  },
  mediaContainer: {
    marginHorizontal: theme.space16,
    marginVertical: theme.space12,
    paddingVertical: theme.space4,
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
    gap: theme.space8,
    minWidth: 0,
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
