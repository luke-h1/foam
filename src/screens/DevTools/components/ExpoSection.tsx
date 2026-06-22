/* eslint-disable no-undef */
import * as Form from '@app/components/Form/Form';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { getHermesVersion } from '../util/getHermesVersion';
import { getReleaseTypeAsync } from '../util/getReleaseTypeAsync';
import { useTranslation } from 'react-i18next';
import i18next from '@app/i18n/i18next';

export function ExpoSection() {
  const { t } = useTranslation('devTools');
  const [envName, setEnvName] = useState<string | null>(null);

  const sdkVersion = (() => {
    const current = Constants.expoConfig?.sdkVersion;
    if (current && current.includes('.')) {
      return current.split('.').shift();
    }
    return current ?? i18next.t('devTools:unknown');
  })();

  useEffect(() => {
    void getReleaseTypeAsync().then(name => {
      setEnvName(name);
    });
  }, []);

  const hermes = getHermesVersion();
  return (
    <>
      <Form.Section title='Expo' titleHint={`SDK ${sdkVersion}`}>
        <Form.Text hint={envName || t('unknown')}>{t('environment')}</Form.Text>
        {hermes && <Form.Text hint={hermes}>Hermes</Form.Text>}
        <Form.Text hint={__DEV__ ? 'development' : 'production'}>
          {t('mode')}
        </Form.Text>
      </Form.Section>
      <Form.Section footer={t('hostFooter')}>
        <Form.Text hint={window.location?.href || t('unknownValue')}>
          {t('host')}
        </Form.Text>
      </Form.Section>
    </>
  );
}
