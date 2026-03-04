import { requireNativeView } from 'expo';
import * as React from 'react';
const NativeView = requireNativeView('CoreHaptics');
export default function CoreHapticsView(props) {
    return <NativeView {...props}/>;
}
//# sourceMappingURL=CoreHapticsView.js.map