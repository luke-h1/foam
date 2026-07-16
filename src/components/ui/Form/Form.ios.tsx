import { ReactElement } from 'react';

import {
  Button,
  Form as SwiftUIForm,
  Host,
  LabeledContent,
  RNHostView,
  Section,
  Text as NativeText,
} from '@expo/ui/swift-ui';

import {
  FormActionRowProps,
  FormInfoRowProps,
  FormRawRowProps,
  FormScreenProps,
  FormSectionProps,
} from './Form.types';

export function FormScreen({ children }: FormScreenProps) {
  return (
    <Host style={{ flex: 1 }}>
      <SwiftUIForm>{children}</SwiftUIForm>
    </Host>
  );
}

export function FormSection({ children, title }: FormSectionProps) {
  return <Section title={title}>{children}</Section>;
}

export function FormInfoRow({ label, value }: FormInfoRowProps) {
  return (
    <LabeledContent label={label}>
      {typeof value === 'string' || typeof value === 'number' ? (
        <NativeText>{String(value)}</NativeText>
      ) : (
        <RNHostView matchContents>{value as ReactElement}</RNHostView>
      )}
    </LabeledContent>
  );
}

export function FormActionRow({ onPress, title, icon }: FormActionRowProps) {
  const systemImage = typeof icon === 'string' ? icon : icon?.ios;
  return <Button label={title} systemImage={systemImage} onPress={onPress} />;
}

export function FormRawRow({ children }: FormRawRowProps) {
  return (
    <Section>
      <RNHostView matchContents>{children as ReactElement}</RNHostView>
    </Section>
  );
}
