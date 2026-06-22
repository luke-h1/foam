import { wrapWithSentry } from '../lib/sentry';
import { wrapWithBugsnagAppStart } from '../lib/bugsnag';
import { RootLayoutShell } from '@app/components/RootLayout/RootLayoutShell';

export default wrapWithBugsnagAppStart(wrapWithSentry(RootLayoutShell));
