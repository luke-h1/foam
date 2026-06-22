import { RootLayoutShell } from '@app/components/RootLayout/RootLayoutShell';

import { wrapWithBugsnagAppStart } from '../lib/bugsnag';
import { wrapWithSentry } from '../lib/sentry';

export default wrapWithBugsnagAppStart(wrapWithSentry(RootLayoutShell));
