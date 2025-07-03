import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Skeleton } from '../Skeleton';

export function LiveStreamCardSkeleton() {
  const { styles } = useStyles(stylesheet);

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

const stylesheet = createStyleSheet(theme => ({
  container: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    columnGap: theme.spacing.sm,
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  imageSkeleton: {
    width: 150,
    height: 100,
    borderRadius: theme.radii.md,
  },
  details: {
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: theme.spacing.md,
  },
  titleSkeleton: {
    height: 20,
    width: '80%',
    marginBottom: theme.spacing.sm,
  },
  metadata: {
    marginVertical: theme.spacing.sm,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  avatarSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: theme.spacing.xs,
  },
  textSkeleton: {
    height: 15,
    width: '60%',
    marginBottom: theme.spacing.xs,
  },
}));
