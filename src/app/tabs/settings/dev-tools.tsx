import { withDevToolsGate } from '@app/components/dev-tools-gate/withDevToolsGate';
import { SettingsDevtoolsScreen } from '@app/screens/settings/SettingsDevtoolsScreen';

const GatedSettingsDevtoolsScreen = withDevToolsGate(SettingsDevtoolsScreen);

export default GatedSettingsDevtoolsScreen;
