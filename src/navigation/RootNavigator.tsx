/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import Header from '../components/Header';
import AuthLoadingScreen from '../screens/authentication/AuthLoading';
import LoginScreen from '../screens/authentication/LoginScreen';
import SettingsModal from '../screens/settings/SettingsModal';
import colors from '../styles/colors';
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
      <RootStack.Screen
        name={RootRoutes.AuthLoading}
        component={AuthLoadingScreen}
      />
      <RootStack.Screen name={RootRoutes.Home} component={HomeTabsNavigator} />
      <RootStack.Group screenOptions={{ presentation: 'transparentModal' }}>
        <RootStack.Screen
          name={RootRoutes.SettingsModal}
          component={SettingsModal}
          options={{
            headerTitleAlign: 'left',
            headerStyle: {
              backgroundColor: colors.black,
            },
            header(props) {
              // @ts-expect-error ts-migrate(2339) FIXME: need to fix this
              return <Header {...props} title="Settings" />;
            },
          }}
        />
      </RootStack.Group>
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
