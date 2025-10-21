import { Button, FlashList } from '@app/components';
import { Image } from '@app/components/Image';
import { Typography } from '@app/components/Typography';
import { useAuthContext } from '@app/context';
import { useAppNavigation } from '@app/hooks';
import { resetRoot } from '@app/navigators/navigationUtilities';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ListRenderItem } from '@shopify/flash-list';
import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface ProfileItem {
  title: string;
  description: string;
  image?: string;
  showEmptyImage?: boolean;
  onPress?: () => void;
}

export function ProfileCard() {
  const { user, logout } = useAuthContext();
  const { navigate } = useAppNavigation();

  const sheetRef = useRef<BottomSheetModal>(null);

  const authenticatedItems: ProfileItem[] = [
    {
      title: user?.display_name as string,
      description: 'Profile',
      image: user?.profile_image_url,
      onPress: () => sheetRef.current?.present(),
    },
    {
      title: 'My Channel',
      description: 'View your channel',
      onPress: () =>
        navigate('Streams', {
          screen: 'StreamerProfile',
          params: {
            id: user?.id as string,
          },
        }),
    },
    {
      title: 'Blocked Users',
      description: 'Manage blocked users',
      onPress: () => {},
    },
    {
      title: 'Log out',
      description: 'Log out of your account',
      onPress: () => {
        void logout();

        setTimeout(() => {
          resetRoot({
            index: 0,
            routes: [
              {
                name: 'Tabs',
                state: {
                  index: 0, // This ensures we land on the first tab (Top)
                  routes: [{ name: 'Top' }],
                },
              },
            ],
          });
        }, 300);
      },
    },
  ];

  const unauthenticatedItems: ProfileItem[] = [
    {
      title: 'Anonymous',
      description: 'Log in to be able to chat, view followed streams and more',
      showEmptyImage: true,
      /**
       * Navigate to login screen
       * eventually we want to be able to login directly here
       * (oauth webview)
       */
      onPress: () => navigate('Login'),
    },
  ];

  const items = user ? authenticatedItems : unauthenticatedItems;

  const renderItem: ListRenderItem<ProfileItem> = useCallback(({ item }) => {
    return (
      <Button style={styles.item} onPress={item.onPress}>
        {(item.image || item.showEmptyImage) && (
          <View style={styles.imageContainer}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={styles.emptyImage} />
            )}
          </View>
        )}
        <View style={styles.contentContainer}>
          <Typography fontWeight="bold">{item.title}</Typography>
          <Typography color="gray" highContrast={false}>
            {item.description}
          </Typography>
        </View>
      </Button>
    );
  }, []);

  return (
    <View style={styles.main}>
      <FlashList<ProfileItem>
        renderItem={renderItem}
        data={items}
        keyExtractor={(item, index) => `${item.title}-${index}`}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  main: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  imageContainer: {
    width: 40,
    height: 40,
    marginRight: theme.spacing.md,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  emptyImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.gray.accent,
    borderStyle: 'dashed',
    borderCurve: 'continuous',
  },
  contentContainer: {
    flex: 1,
    gap: theme.spacing.xs,
  },
}));
