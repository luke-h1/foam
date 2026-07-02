import { RemoteConfigScreen } from '@app/screens/DevTools/RemoteConfigScreen';
import { withDevToolsGate } from '@app/utils/devTools/devToolsGate';

const GatedRemoteConfigScreen = withDevToolsGate(RemoteConfigScreen);

export default GatedRemoteConfigScreen;
