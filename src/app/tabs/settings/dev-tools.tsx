import { SettingsDevtoolsScreen } from '@app/screens/settings/SettingsDevtoolsScreen';
import { withDevToolsGate } from '@app/utils/dev-tools/devToolsGate';

const GatedSettingsDevtoolsScreen = withDevToolsGate(SettingsDevtoolsScreen);

export default GatedSettingsDevtoolsScreen;
