import { useEffect } from 'react';
import { Stack } from 'tamagui';
import { Flex } from '../../components/Flex';
import Spinner from '../../components/loading/Spinner';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';
import { iconSizes } from '../../styles';

const AuthLoadingScreen = ({
  navigation,
}: RootStackScreenProps<RootRoutes.AuthLoading>) => {
  const { navigate } = navigation;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setTimeout(() => {
      navigate(RootRoutes.Home);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack flex={1} justifyContent="center" alignItems="center">
      <Flex
        centered
        row
        flexDirection="row"
        gap="$spacing4"
        marginTop="$spacing60"
        padding="$spacing4"
      >
        <Spinner color="$neutral3" size={iconSizes.icon64} />
      </Flex>
    </Stack>
  );
};
export default AuthLoadingScreen;
