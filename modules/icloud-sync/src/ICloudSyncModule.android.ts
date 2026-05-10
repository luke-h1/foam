import type { ICloudSyncNativeModule } from "./ICloudSync.types";

const unavailableModule: ICloudSyncNativeModule = {
  async getString() {
    return null;
  },
  isAvailable() {
    return false;
  },
  async remove() {},
  async setString() {},
  async synchronize() {
    return false;
  },
};

export default unavailableModule;
