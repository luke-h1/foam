import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as AC from '@bacons/apple-colors';
import * as Application from 'expo-application';

import * as Form from '@app/components/Form/Form';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

import { getStoreUrlAsync } from '../util/getStoreUrlAsync';

export function AppStoreSection() {
  const { t } = useTranslation('devTools');
  const [canOpenStore, setCanOpenStore] = useState<boolean>(true);
  if (process.env.EXPO_OS === 'web') {
    return null;
  }

  return (
    <Form.Section
      title={process.env.EXPO_OS === 'ios' ? t('appStore') : t('playStore')}
    >
      <Form.Text
        hint={`${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={async () => {
          const appStoreLink = await getStoreUrlAsync();
          setCanOpenStore(!!appStoreLink);
          if (appStoreLink) {
            openLinkInBrowser(appStoreLink);
          }
        }}
        style={{ color: AC.systemBlue }}
      >
        {canOpenStore ? t('checkForAppUpdates') : t('appNotAvailable')}
      </Form.Text>
      <Form.Text hint={Application.applicationId}>
        {process.env.EXPO_OS === 'ios' ? t('bundleId') : t('appId')}
      </Form.Text>
    </Form.Section>
  );
}
