import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import {
  HomeTabsRoutes,
  HomeTabsScreenProps,
} from '../navigation/Home/HomeTabs';
import { RootRoutes } from '../navigation/RootStack';
import colors from '../styles/colors';
import Title from './Title';

interface Props extends HomeTabsScreenProps<HomeTabsRoutes.Top> {
  title: string;
  showAvatar?: boolean;
}

const Header = ({ title, navigation, showAvatar = true }: Props) => {
  const { user } = useAuthContext();
  return (
    <View style={styles.container}>
      <Title>{title}</Title>
      {showAvatar && (
        <View style={styles.right}>
          {!user ? (
            <TouchableOpacity
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              onPress={() => navigation.navigate(RootRoutes.SettingsModal)}
              style={styles.avatar}
            />
          ) : (
            <TouchableOpacity
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              onPress={() => navigation.navigate(RootRoutes.SettingsModal)}
            >
              <Image
                style={styles.avatar}
                source={{ uri: user?.profile_image_url }}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  title: {
    color: colors.gray,
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingRight: 14,
    marginBottom: 15,
  },
  avatar: {
    backgroundColor: colors.tag,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  onlineStatus: {
    backgroundColor: colors.green,
    width: 10,
    height: 10,
    borderRadius: 10,
    borderColor: colors.primary,
    borderStyle: 'solid',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    marginLeft: 20,
  },
});
