import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { Color } from '@app/styles/palette';
import { theme } from '@app/styles/themes';

export function LiveStreamCardSkeleton({
  layout = 'compact',
}: {
  layout?: 'compact' | 'media';
}) {
  if (layout === 'media') {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        style={styles.mediaContainer}
        testID='stream-skeleton'
      >
        <Skeleton style={styles.mediaImageSkeleton} />

        <View style={styles.mediaDetailsRow}>
          <Skeleton style={styles.avatarSkeleton} />

          <View style={styles.mediaTextColumn}>
            <Skeleton style={styles.mediaUsernameSkeleton} />
            <Skeleton style={styles.mediaTitleSkeleton} />
            <Skeleton style={styles.mediaTitleSecondLineSkeleton} />
            <Skeleton style={styles.mediaCategorySkeleton} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
      style={styles.container}
      testID='stream-skeleton'
    >
      <View style={styles.imageContainer}>
        <Skeleton style={styles.imageSkeleton} />
      </View>

      <View style={styles.details}>
        <Skeleton style={styles.usernameSkeleton} />
        <Skeleton style={styles.titleSkeleton} />
        <View style={styles.metadataRow}>
          <Skeleton style={styles.metaTextSkeleton} />
          <Skeleton style={styles.metaDividerSkeleton} />
          <Skeleton style={styles.metaWideSkeleton} />
        </View>
        <Skeleton style={styles.categoryLineSkeleton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSkeleton: {
    borderRadius: theme.borderRadius999,
    flexShrink: 0,
    height: 44,
    marginTop: 2,
    width: 44,
  },
  categoryLineSkeleton: {
    borderRadius: theme.borderRadius4,
    height: 16,
    marginTop: theme.space4,
    width: 88,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: Color.zinc[900],
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius14,
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    flexShrink: 0,
    height: 88,
    marginRight: theme.space12,
    overflow: 'hidden',
    width: 132,
  },
  imageSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    height: 88,
    width: 132,
  },
  mediaCategorySkeleton: {
    borderRadius: theme.borderRadius4,
    height: 20,
    marginTop: theme.space4,
    width: 148,
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
  mediaTitleSecondLineSkeleton: {
    borderRadius: theme.borderRadius4,
    height: 23,
    width: '64%',
  },
  mediaTitleSkeleton: {
    borderRadius: theme.borderRadius4,
    height: 23,
    width: '100%',
  },
  mediaUsernameSkeleton: {
    borderRadius: theme.borderRadius4,
    height: 21,
    width: 128,
  },
  metaDividerSkeleton: {
    borderRadius: theme.borderRadius999,
    height: 10,
    width: 10,
  },
  metaTextSkeleton: {
    borderRadius: theme.borderRadius4,
    height: 12,
    width: 48,
  },
  metaWideSkeleton: {
    borderRadius: theme.borderRadius4,
    height: 12,
    width: 96,
  },
  metadataRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: theme.space8,
  },
  titleSkeleton: {
    borderRadius: theme.borderRadius4,
    height: 23,
    width: '72%',
  },
  usernameSkeleton: {
    borderRadius: theme.borderRadius4,
    height: 24,
    width: 74,
  },
});
