import { useTranslation } from 'react-i18next';

import * as Updates from 'expo-updates';

import * as Form from '@app/components/Form/Form';

export function OTASection() {
  const { t } = useTranslation('devTools');

  return (
    <Form.Section title={t('currentUpdate')}>
      <Form.Text hint={Updates.runtimeVersion}>{t('runtimeVersion')}</Form.Text>
      <Form.Text hint={`${Updates.channel || t('unknownValue')}`}>
        {t('channel')}
      </Form.Text>
      <Form.Text
        hint={
          Updates.createdAt?.toLocaleString('en-US', {
            timeZoneName: 'short',
          }) ?? t('unknown')
        }
      >
        Created
      </Form.Text>
      <Form.Text hintBoolean={Updates.isEmbeddedLaunch}>
        {t('embedded')}
      </Form.Text>
      <Form.Text hintBoolean={Updates.isEmergencyLaunch}>
        Emergency Launch
      </Form.Text>
      <Form.Text
        hint={
          Updates.launchDuration
            ? `${String(Updates.launchDuration?.toFixed(0))}ms`
            : 'unknown'
        }
      >
        Launch Duration
      </Form.Text>
      <Form.Text hint={Updates.updateId ?? '[none]'}>ID</Form.Text>
    </Form.Section>
  );
}
