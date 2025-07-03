/* eslint-disable no-undef */
import * as Form from '@app/components/Form/Form';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { getHermesVersion, getReleaseTypeAsync } from '../utils';

export function ExpoSection() {
  const [envName, setEnvName] = useState<string | null>(null);

  const sdkVersion = (() => {
    const current = Constants.expoConfig?.sdkVersion;
    if (current && current.includes('.')) {
      return current.split('.').shift();
    }
    return current ?? 'Unknown';
  })();

  useEffect(() => {
    void getReleaseTypeAsync().then(name => {
      setEnvName(name);
    });
  }, []);

  const hermes = getHermesVersion();
  return (
    <>
      <Form.Section title="Expo" titleHint={`SDK ${sdkVersion}`}>
        <Form.Text hint={envName || 'Unknown'}>Environment</Form.Text>
        {hermes && <Form.Text hint={hermes}>Hermes</Form.Text>}
        <Form.Text hint={__DEV__ ? 'development' : 'production'}>
          Mode
        </Form.Text>
      </Form.Section>
      <Form.Section footer="Embedded origin URL that Expo Router uses to invoke React Server Functions. This should be hosted and available to the client.">
        <Form.Text hint={window.location?.href || 'unknown'}>Host</Form.Text>
      </Form.Section>
    </>
  );
}
