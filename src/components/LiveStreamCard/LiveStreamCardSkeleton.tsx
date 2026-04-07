import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../Skeleton/Skeleton';

export function LiveStreamCardSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Skeleton style={styles.imageSkeleton} />
      </View>
      <View style={styles.details}>
        <Skeleton style={styles.titleSkeleton} />
        <View style={styles.metadata}>
          <View style={styles.info}>
            <Skeleton style={styles.avatarSkeleton} />
            <Skeleton style={styles.textSkeleton} />
          </View>
          <Skeleton style={styles.textSkeleton} />
        </View>
        <Skeleton style={styles.textSkeleton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSkeleton: {
    borderRadius: 10,
    height: 20,
    marginRight: theme.spacing.xs,
    width: 20,
  },
  container: {
    columnGap: theme.spacing.sm,
    flexDirection: 'row',
    flex: 1,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xl,
  },
  details: {
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: theme.spacing.md,
  },
  imageContainer: {
    position: 'relative',
  },
  imageSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    height: 100,
    width: 150,
  },
  info: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: theme.spacing.md,
  },
  metadata: {
    marginVertical: theme.spacing.sm,
  },
  textSkeleton: {
    height: 15,
    marginBottom: theme.spacing.xs,
    width: '60%',
  },
  titleSkeleton: {
    height: 20,
    marginBottom: theme.spacing.sm,
    width: '80%',
  },
});
