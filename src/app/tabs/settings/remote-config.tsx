import { RemoteConfigScreen } from '@app/screens/dev-tools/remote-config-screen';
import { withDevToolsGate } from '@app/utils/dev-tools/dev-tools-gate';

const GatedRemoteConfigScreen = withDevToolsGate(RemoteConfigScreen);

export default GatedRemoteConfigScreen;
