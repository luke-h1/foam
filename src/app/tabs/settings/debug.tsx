import { DebugScreen } from '@app/screens/dev-tools/DebugScreen';
import { withDevToolsGate } from '@app/utils/dev-tools/devToolsGate';

const GatedDebugScreen = withDevToolsGate(DebugScreen);

export default GatedDebugScreen;
