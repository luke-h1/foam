import { NativeModule } from 'expo';
import { CoreHapticsModuleEvents } from './CoreHaptics.types';
declare class CoreHapticsModule extends NativeModule<CoreHapticsModuleEvents> {
    PI: number;
    setValueAsync(value: string): Promise<void>;
    hello(): string;
}
declare const _default: typeof CoreHapticsModule;
export default _default;
//# sourceMappingURL=CoreHapticsModule.web.d.ts.map