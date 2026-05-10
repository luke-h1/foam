import { theme } from '@app/styles/themes';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../Skeleton/Skeleton';

export function LiveStreamCardSkeleton({
  layout = 'compact',
}: {
  layout?: 'compact' | 'media' | 'text';
}) {
  const isMediaLayout = layout === 'media';
  const isTextLayout = layout === 'text';
  const imageStyle = isTextLayout
    ? { ...styles.imageSkeleton, ...styles.imageText }
    : isMediaLayout
      ? { ...styles.imageSkeleton, ...styles.imageMedia }
      : styles.imageSkeleton;
  const titleStyle = isTextLayout
    ? { ...styles.titleSkeleton, ...styles.titleText }
    : styles.titleSkeleton;

  return (
    <View
      style={[
        styles.container,
        isMediaLayout && styles.containerMedia,
        isTextLayout && styles.containerText,
      ]}
    >
      {!isTextLayout ? (
        <View style={styles.imageContainer}>
          <Skeleton style={imageStyle} />
        </View>
      ) : null}

      <View style={styles.details}>
        <View style={styles.headerRow}>
          <Skeleton style={styles.usernameSkeleton} />
          {isTextLayout ? <Skeleton style={styles.categorySkeleton} /> : null}
        </View>
        <Skeleton style={titleStyle} />
        <View style={styles.metadata}>
          <View style={styles.info}>
            <Skeleton style={styles.metaTextSkeleton} />
            <Skeleton style={styles.metaDividerSkeleton} />
            <Skeleton style={styles.metaWideSkeleton} />
          </View>
        </View>
        {!isTextLayout ? (
          <Skeleton style={styles.categoryLineSkeleton} />
        ) : null}
      </View>

      {isTextLayout ? <Skeleton style={imageStyle} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryLineSkeleton: {
    borderRadius: theme.borderRadius12,
    height: 20,
    width: 88,
  },
  categorySkeleton: {
    borderRadius: theme.borderRadius12,
    height: 18,
    marginLeft: 'auto',
    width: 68,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
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
  containerText: {
    alignItems: 'stretch',
    minHeight: 104,
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
    borderRadius: theme.borderRadius16,
    height: 88,
    width: 132,
  },
  imageText: {
    alignSelf: 'center',
    height: 76,
    marginLeft: theme.space12,
    width: 108,
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
  titleText: {
    width: '92%',
  },
  usernameSkeleton: {
    height: 14,
    width: 74,
  },
});
