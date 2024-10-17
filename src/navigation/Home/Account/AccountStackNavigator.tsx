import AccountScreen from '@app/screens/account/AccountScreen';
import { AccountRoutes, AccountStack } from './AccountStack';

export default function AccountStackNavigator() {
  return (
    <AccountStack.Navigator
      initialRouteName={AccountRoutes.Account}
      screenOptions={{ headerShown: false }}
    >
      <AccountStack.Screen
        name={AccountRoutes.Account}
        component={AccountScreen}
      />
    </AccountStack.Navigator>
  );
}
