import { DebugScreen } from '@app/screens/dev-tools/debug-screen';
import { withDevToolsGate } from '@app/utils/dev-tools/dev-tools-gate';

const GatedDebugScreen = withDevToolsGate(DebugScreen);

export default GatedDebugScreen;
