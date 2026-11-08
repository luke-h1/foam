import { wrapWithSentry } from '@app/lib/sentry';

import { RootLayoutShell } from './RootLayoutShell';

export default wrapWithSentry(RootLayoutShell);
