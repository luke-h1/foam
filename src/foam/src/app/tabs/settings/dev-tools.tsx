import { SettingsDevtoolsScreen } from '@app/screens/SettingsScreen/SettingsDevtoolsScreen';
import { withDevToolsGate } from '@app/utils/devTools/devToolsGate';

const GatedSettingsDevtoolsScreen = withDevToolsGate(SettingsDevtoolsScreen);

export default GatedSettingsDevtoolsScreen;
