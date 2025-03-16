import { ChangelogScreen } from '@app/screens';
import { AboutScreen, FaqScreen } from '@app/screens/Other';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type OtherStackParamList = {
  About: undefined;
  Changelog: undefined;
  Faq: undefined;
};

const Stack = createNativeStackNavigator<OtherStackParamList>();

export type OtherStackScreenProps<T extends keyof OtherStackParamList> =
  StackScreenProps<OtherStackParamList, T>;

export function OtherStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Changelog"
        component={ChangelogScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Faq"
        component={FaqScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
