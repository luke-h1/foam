import { RootLayoutShell } from '@app/components/RootLayout/RootLayoutShell';

import { wrapWithSentry } from '../lib/sentry';

export default wrapWithSentry(RootLayoutShell);
