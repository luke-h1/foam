import * as AppleColors from '@bacons/apple-colors';
import * as Updates from 'expo-updates';

import * as Form from '@app/components/form/Form';
import { SymbolView } from '@app/components/ui/icon/Icon';

function booleanHint(value: boolean) {
  return value ? (
    <SymbolView
      name='checkmark.circle.fill'
      tintColor={AppleColors.systemGreen}
    />
  ) : (
    <SymbolView name='slash.circle' tintColor={AppleColors.systemGray} />
  );
}

export function OTASection() {
  return (
    <Form.Section title='Current Update'>
      <Form.Text hint={Updates.runtimeVersion}>Runtime version</Form.Text>
      <Form.Text hint={Updates.channel || 'unknown'}>Channel</Form.Text>
      <Form.Text
        hint={
          Updates.createdAt?.toLocaleString('en-US', {
            timeZoneName: 'short',
          }) ?? 'Unknown'
        }
      >
        Created
      </Form.Text>
      <Form.Text hint={booleanHint(Updates.isEmbeddedLaunch)}>
        Embedded
      </Form.Text>
      <Form.Text hint={booleanHint(Updates.isEmergencyLaunch)}>
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
