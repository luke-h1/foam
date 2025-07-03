import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import App from './App';
import 'expo-dev-client';

SplashScreen.preventAutoHideAsync();

function FoamApp() {
  // eslint-disable-next-line react/jsx-filename-extension
  return <App />;
}

registerRootComponent(FoamApp);
