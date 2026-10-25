import { RemoteConfigScreen } from '@app/screens/dev-tools/RemoteConfigScreen';
import { withDevToolsGate } from '@app/utils/dev-tools/devToolsGate';

const GatedRemoteConfigScreen = withDevToolsGate(RemoteConfigScreen);

export default GatedRemoteConfigScreen;
