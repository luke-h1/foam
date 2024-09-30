import { useAuthContext } from '@app/context/AuthContext';
import { RootRoutes } from '@app/navigation/RootStack';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from './Image';

type BaseProps = {
  title: string;
};
type Props = BottomTabHeaderProps & BaseProps;

export default function Header({ title, navigation }: Props) {
  const { user } = useAuthContext();
  const { navigate } = navigation;

  return (
    <SafeAreaView>
      <View
        style={{
          paddingHorizontal: 10,
          marginBottom: 10,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <Text>{title}</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {!user ? (
            <TouchableOpacity
              onPress={() => navigate(RootRoutes.SettingsModal)}
              style={styles.avatar}
            />
          ) : (
            <TouchableOpacity
              onPress={() => navigate(RootRoutes.SettingsModal)}
            >
              <Image
                source={{ uri: user?.profile_image_url }}
                style={{
                  backgroundColor: '#000',
                  width: 30,
                  height: 30,
                  borderRadius: 16,
                }}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: 'gray',
    width: 30,
    height: 30,
    borderRadius: 16,
  },
});
