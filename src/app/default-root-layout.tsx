import { RootLayoutShell } from '@app/components/root-layout/RootLayoutShell';

import { wrapWithSentry } from '../lib/sentry';

export default wrapWithSentry(RootLayoutShell);
