import { withDevToolsGate } from '@app/components/dev-tools-gate/withDevToolsGate';
import { CachedImagesScreen } from '@app/screens/dev-tools/CachedImagesScreen';

const GatedCachedImagesScreen = withDevToolsGate(CachedImagesScreen);

export default GatedCachedImagesScreen;
