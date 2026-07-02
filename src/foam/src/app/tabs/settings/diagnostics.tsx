import { DiagnosticsScreen } from '@app/screens/DevTools/DiagnosticsScreen';
import { withDevToolsGate } from '@app/utils/devTools/devToolsGate';

const GatedDiagnosticsScreen = withDevToolsGate(DiagnosticsScreen);

export default GatedDiagnosticsScreen;
