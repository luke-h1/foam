import { withDevToolsGate } from '@app/components/dev-tools-gate/withDevToolsGate';
import { DebugScreen } from '@app/screens/dev-tools/DebugScreen';

const GatedDebugScreen = withDevToolsGate(DebugScreen);

export default GatedDebugScreen;
