import { NativeModule } from 'expo';
import { CoreHapticsModuleEvents } from './CoreHaptics.types';
declare class CoreHapticsModule extends NativeModule<CoreHapticsModuleEvents> {
    PI: number;
    hello(): string;
    setValueAsync(value: string): Promise<void>;
}
declare const _default: CoreHapticsModule;
export default _default;
//# sourceMappingURL=CoreHapticsModule.d.ts.map