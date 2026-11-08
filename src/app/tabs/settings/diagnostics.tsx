import { withDevToolsGate } from '@app/components/dev-tools-gate/withDevToolsGate';
import { DiagnosticsScreen } from '@app/screens/dev-tools/DiagnosticsScreen';

const GatedDiagnosticsScreen = withDevToolsGate(DiagnosticsScreen);

export default GatedDiagnosticsScreen;
