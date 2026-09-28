import { SettingsDevtoolsScreen } from '@app/screens/settings-screen/settings-devtools-screen';
import { withDevToolsGate } from '@app/utils/dev-tools/dev-tools-gate';

const GatedSettingsDevtoolsScreen = withDevToolsGate(SettingsDevtoolsScreen);

export default GatedSettingsDevtoolsScreen;
