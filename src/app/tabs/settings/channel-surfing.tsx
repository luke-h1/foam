import { withDevToolsGate } from '@app/components/dev-tools-gate/withDevToolsGate';
import { ChannelSurfingScreen } from '@app/screens/dev-tools/ChannelSurfingScreen';

const GatedChannelSurfingScreen = withDevToolsGate(ChannelSurfingScreen);

export default GatedChannelSurfingScreen;
