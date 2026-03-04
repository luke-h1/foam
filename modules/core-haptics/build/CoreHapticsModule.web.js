import { registerWebModule, NativeModule } from 'expo';
class CoreHapticsModule extends NativeModule {
    PI = Math.PI;
    async setValueAsync(value) {
        this.emit('onChange', { value });
    }
    hello() {
        return 'Hello world! 👋';
    }
}
export default registerWebModule(CoreHapticsModule, 'CoreHapticsModule');
//# sourceMappingURL=CoreHapticsModule.web.js.map