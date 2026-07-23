import type { SignpostNativeModule } from './Signpost.types';

// iOS-only Instruments helper; Android is a no-op.
const unavailableModule: SignpostNativeModule = {
  mark() {},
  begin() {},
  end() {},
};

export default unavailableModule;
