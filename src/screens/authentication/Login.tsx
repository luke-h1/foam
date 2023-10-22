import { useRef } from 'react';
import { WebView } from 'react-native-webview';

const LoginScreen = () => {
  const ref = useRef<WebView | null>(null);
  const twitchDarkTheme = `window.localStorage.setItem('twilight.theme', '1'); true;`;

  return (
    <WebView
      source={{ uri: 'https://twitch.tv/login' }}
      ref={ref}
      onNavigationStateChange={() => {}}
      onMessage={() => {}}
      thirdPartyCookiesEnabled
      injectedJavaScript={twitchDarkTheme}
      cacheEnabled
      sharedCookiesEnabled
      style={{
        flex: 1,
      }}
    />
  );
};

export default LoginScreen;
