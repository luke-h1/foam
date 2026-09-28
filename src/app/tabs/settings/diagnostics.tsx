import { DiagnosticsScreen } from '@app/screens/dev-tools/diagnostics-screen';
import { withDevToolsGate } from '@app/utils/dev-tools/dev-tools-gate';

const GatedDiagnosticsScreen = withDevToolsGate(DiagnosticsScreen);

export default GatedDiagnosticsScreen;
