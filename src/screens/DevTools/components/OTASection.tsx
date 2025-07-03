import * as Form from '@app/components/Form/Form';
import * as Updates from 'expo-updates';

export function OTASection() {
  return (
    <Form.Section title="Current Update">
      <Form.Text hint={Updates.runtimeVersion}>Runtime version</Form.Text>
      <Form.Text hint={`${Updates.channel || 'unknown'}`}>Channel</Form.Text>
      <Form.Text
        hint={(Updates.createdAt ?? new Date()).toLocaleString('en-US', {
          timeZoneName: 'short',
        })}
      >
        Created
      </Form.Text>
      <Form.Text hintBoolean={Updates.isEmbeddedLaunch}>Embedded</Form.Text>
      <Form.Text hintBoolean={Updates.isEmergencyLaunch}>
        Emergency Launch
      </Form.Text>
      {/* <Form.Text hint={`${String(Updates.launchDuration?.toFixed(0))}ms`}> */}
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
