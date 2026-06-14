import { wrapWithSentry } from '../lib/sentry';
import { RootLayoutShell } from '@app/components/RootLayout/RootLayoutShell';

export default wrapWithSentry(RootLayoutShell);
