import { AppStackParamList } from '@app/navigators/AppNavigator';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function useAppNavigation<
  TParam extends ParamListBase = AppStackParamList,
>() {
  const navigation = useNavigation<NativeStackNavigationProp<TParam>>();
  return navigation;
}
