import { StyleSheet } from 'react-native';

import {
  Button,
  Form,
  Host,
  LabeledContent,
  RNHostView,
  Section,
  Text as NativeText,
} from '@expo/ui/swift-ui';

import { openLicenseList } from '@app/lib/legal';
import { SWIFTUI_ROW_CONTENT_INSET } from '@app/styles/native-form';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

import { AboutIdentity } from './components/AboutIdentity';
import { useAboutDetails } from './hooks/use-about-details';

export function AboutScreen() {
  const { websiteUrl, statusPageUrl, version, build, otaLabel } =
    useAboutDetails();

  return (
    <Host style={styles.host}>
      <Form>
        <Section>
          <RNHostView matchContents>
            <AboutIdentity style={styles.hostedRowInset} />
          </RNHostView>
        </Section>

        <Section title='Resources'>
          <Button
            label='Website'
            systemImage='globe'
            onPress={() => openLinkInBrowser(websiteUrl)}
          />
          <Button
            label='Status'
            systemImage='checkmark.shield'
            onPress={() => openLinkInBrowser(statusPageUrl)}
          />
          <Button
            label='Licenses'
            systemImage='doc.text'
            onPress={() => openLicenseList('Licenses')}
          />
        </Section>

        <Section title='Build'>
          <LabeledContent label='Version'>
            <NativeText>{version}</NativeText>
          </LabeledContent>
          <LabeledContent label='Build'>
            <NativeText>{build}</NativeText>
          </LabeledContent>
          <LabeledContent label='OTA'>
            <NativeText>{otaLabel}</NativeText>
          </LabeledContent>
        </Section>
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  hostedRowInset: {
    paddingHorizontal: SWIFTUI_ROW_CONTENT_INSET,
  },
});
