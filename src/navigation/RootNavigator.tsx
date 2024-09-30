import AuthLoading from '@app/screens/authentication/AuthLoading';
import LoginScreen from '@app/screens/authentication/LoginScreen';
import SettingsModal from '@app/screens/settings/SettingsModal';
import Header from '../components/Header';
import CategoryStackNavigator from './Category/CategoryStackNavigator';
import HomeTabsNavigator from './Home/HomeTabsNavigator';
import { RootRoutes, RootStack } from './RootStack';
import StreamNavigator from './Stream/StreamStackNavigator';

const RootNavigator = () => {
  return (
    <RootStack.Navigator
      initialRouteName={RootRoutes.AuthLoading}
      screenOptions={{
        headerShown: false,
      }}
    >
      <RootStack.Screen name={RootRoutes.AuthLoading} component={AuthLoading} />
      <RootStack.Screen name={RootRoutes.Home} component={HomeTabsNavigator} />
      <RootStack.Screen
        name={RootRoutes.SettingsModal}
        component={SettingsModal}
        options={{
          headerTitleAlign: 'left',
          headerStyle: {
            backgroundColor: '$color',
          },
          presentation: 'card',
          // eslint-disable-next-line react/no-unstable-nested-components
          header(props) {
            // @ts-expect-error ts-migrate(2339) FIXME: need to fix this
            return <Header {...props} title="Settings" />;
          },
        }}
      />
      <RootStack.Screen name={RootRoutes.Login} component={LoginScreen} />
      <RootStack.Screen
        name={RootRoutes.LiveStream}
        component={StreamNavigator}
      />
      <RootStack.Screen
        name={RootRoutes.Category}
        component={CategoryStackNavigator}
      />
    </RootStack.Navigator>
  );
};
export default RootNavigator;
