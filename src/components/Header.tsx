import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import { RootRoutes } from '../navigation/RootStack';
import colors from '../styles/colors';
import Title from './Title';

type BaseProps = {
  title: string;
  showAvatar?: boolean;
};
// progress, styleInterpolator
type Props = BottomTabHeaderProps & BaseProps;

export default function Header({
  title,
  navigation,
  showAvatar = true,
}: Props) {
  const { user } = useAuthContext();
  return (
    <SafeAreaView style={styles.container}>
      <Title>{title}</Title>
      {showAvatar && (
        <View style={styles.right}>
          {!user ? (
            <TouchableOpacity
              onPress={() => navigation.navigate(RootRoutes.SettingsModal)}
              style={styles.avatar}
            />
          ) : (
            <TouchableOpacity
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
    </SafeAreaView>
  );
}

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
    backgroundColor: colors.primary,
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
