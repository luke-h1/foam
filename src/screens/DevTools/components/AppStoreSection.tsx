import * as Form from '@app/components/Form/Form';
import { openLinkInBrowser } from '@app/utils';
import * as AC from '@bacons/apple-colors';
import * as Application from 'expo-application';
import { useState } from 'react';
import { getStoreUrlAsync } from '../utils';

export function AppStoreSection() {
  const [canOpenStore, setCanOpenStore] = useState<boolean>(true);
  if (process.env.EXPO_OS === 'web') {
    return null;
  }

  return (
    <Form.Section
      title={process.env.EXPO_OS === 'ios' ? 'App Store' : 'Play Store'}
    >
      <Form.Text
        hint={`${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={async () => {
          const appStoreLink = await getStoreUrlAsync();
          setCanOpenStore(!!appStoreLink);
          console.log('App Store link:', appStoreLink);
          if (appStoreLink) {
            openLinkInBrowser(appStoreLink);
          }
        }}
        style={{ color: AC.systemBlue }}
      >
        {canOpenStore ? `Check for app updates` : 'App not available'}
      </Form.Text>
      <Form.Text hint={Application.applicationId}>
        {process.env.EXPO_OS === 'ios' ? `Bundle ID` : 'App ID'}
      </Form.Text>
    </Form.Section>
  );
}
