import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { H4, Stack } from 'tamagui';
import { useAuthContext } from '../context/AuthContext';
import { RootRoutes } from '../navigation/RootStack';
import { colors } from '../styles';
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
      <Stack
        paddingHorizontal={10}
        marginBottom={10}
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
      >
        <H4 color="$color">{title}</H4>
        <Stack flexDirection="row" alignItems="center">
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
        </Stack>
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.gray300,
    width: 30,
    height: 30,
    borderRadius: 16,
  },
});
