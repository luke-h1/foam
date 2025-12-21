import { ChangelogScreen } from '@app/screens/Other/ChangelogScreen';
import { AboutScreen } from '@app/screens/Other/AboutScreen';
import { FaqScreen } from '@app/screens/Other/FaqScreen';
import { LicensesScreen } from '@app/screens/Other/LicensesScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type OtherStackParamList = {
  About: undefined;
  Changelog: undefined;
  Faq: undefined;
  Licenses: undefined;
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
        options={{ headerShown: false, orientation: 'portrait_up' }}
      />
      <Stack.Screen
        name="Changelog"
        component={ChangelogScreen}
        options={{ headerShown: false, orientation: 'portrait_up' }}
      />
      <Stack.Screen
        name="Faq"
        component={FaqScreen}
        options={{ headerShown: false, orientation: 'portrait_up' }}
      />
      <Stack.Screen
        name="Licenses"
        component={LicensesScreen}
        options={{ headerShown: false, orientation: 'portrait_up' }}
      />
    </Stack.Navigator>
  );
}
