import { requireNativeModule } from 'expo';

import type { ChangelogNativeModule } from './Changelog.types';

export default requireNativeModule<ChangelogNativeModule>('Changelog');
