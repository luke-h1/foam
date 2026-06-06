import { ObserveRoot } from 'expo-observe';
import { wrapWithSentry } from '../lib/sentry';
import { RootLayoutShell } from '@app/components/RootLayout/RootLayoutShell';

const ObservedRootLayout = ObserveRoot.wrap(RootLayoutShell);

export default wrapWithSentry(ObservedRootLayout);
