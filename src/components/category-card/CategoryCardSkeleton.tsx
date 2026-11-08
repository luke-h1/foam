import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@app/components/ui/skeleton/Skeleton';
import { sizeStyles } from '@app/components/ui/text/Text.styles';
import { theme } from '@app/styles/themes';

import { IMAGE_ASPECT_RATIO } from './constants';

export function CategoryCardSkeleton() {
  return (
    <View style={styles.container} testID='category-skeleton'>
      <Skeleton style={styles.image} />
      <View style={styles.titleLine}>
        <Skeleton style={styles.title} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: theme.space16,
    paddingHorizontal: 6,
  },
  image: {
    aspectRatio: IMAGE_ASPECT_RATIO,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    width: '100%',
  },
  titleLine: {
    height: sizeStyles.subhead.lineHeight,
    justifyContent: 'center',
    marginTop: theme.space8,
  },
  title: {
    height: 11,
    width: '70%',
  },
});
