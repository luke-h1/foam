import { DiagnosticsScreen } from '@app/screens/dev-tools/DiagnosticsScreen';
import { withDevToolsGate } from '@app/utils/dev-tools/devToolsGate';

const GatedDiagnosticsScreen = withDevToolsGate(DiagnosticsScreen);

export default GatedDiagnosticsScreen;
