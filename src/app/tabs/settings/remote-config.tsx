import { withDevToolsGate } from '@app/components/dev-tools-gate/withDevToolsGate';
import { RemoteConfigScreen } from '@app/screens/dev-tools/RemoteConfigScreen';

const GatedRemoteConfigScreen = withDevToolsGate(RemoteConfigScreen);

export default GatedRemoteConfigScreen;
