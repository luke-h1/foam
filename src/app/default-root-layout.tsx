import { RootLayoutShell } from '@app/components/root-layout/root-layout-shell';

import { wrapWithSentry } from '../lib/sentry';

export default wrapWithSentry(RootLayoutShell);
