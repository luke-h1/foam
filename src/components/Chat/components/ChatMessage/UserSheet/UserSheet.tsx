import { Image } from '@app/components/Image';
import { Typography } from '@app/components/Typography';
import { twitchService } from '@app/services';
import { formatDate } from '@app/utils';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useQuery } from '@tanstack/react-query';
import { forwardRef, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface Props {
  userId?: string;
}

export const UserSheet = forwardRef<BottomSheetModal, Props>((props, ref) => {
  const { userId } = props;

  const snapPoints = useMemo(() => ['25%', '50%', '60%'], []);

  const { data, isPending, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => twitchService.getUser(userId),
  });

  /**
   * Todo fetch badges
   */

  return (
    <BottomSheetModal
      ref={ref}
      style={styles.contentContainer}
      backgroundStyle={styles.bottomSheet}
      enablePanDownToClose
      snapPoints={snapPoints}
    >
      <BottomSheetView style={styles.wrapper}>
        {error && !isPending && (
          <Typography>Failed to load user details</Typography>
        )}
        {isPending ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <View style={styles.info}>
            <Image
              source={data?.profile_image_url ?? ''}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.userInfo}>
              <Typography weight="bold">{data?.display_name}</Typography>
              {data?.created_at && (
                <Typography>
                  Account created: {formatDate(data?.created_at, 'MMMM D YYYY')}
                </Typography>
              )}
            </View>
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
UserSheet.displayName = 'UserSheet';

const styles = StyleSheet.create(theme => ({
  info: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.xl,
    overflow: 'visible',
  },
  bottomSheet: {
    backgroundColor: theme.colors.borderFaint,
  },
  wrapper: {
    paddingVertical: theme.spacing.md,
  },
  image: {
    width: 80,
    height: 80,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
}));
