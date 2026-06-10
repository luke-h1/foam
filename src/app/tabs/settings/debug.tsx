import { DebugScreen } from '@app/screens/DevTools/DebugScreen';
import { withDevToolsGate } from '@app/utils/devTools/devToolsGate';

const GatedDebugScreen = withDevToolsGate(DebugScreen);

export default GatedDebugScreen;
