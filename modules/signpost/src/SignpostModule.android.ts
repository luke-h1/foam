import type { SignpostNativeModule } from './Signpost.types';

const unavailableModule: SignpostNativeModule = {
  mark() {},
  begin() {},
  end() {},
};

export default unavailableModule;
