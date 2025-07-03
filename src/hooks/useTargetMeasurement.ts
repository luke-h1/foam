import { useEffect, useState } from 'react';
import {
  measure,
  MeasuredDimensions,
  runOnUI,
  useAnimatedRef,
  useSharedValue,
} from 'react-native-reanimated';

/**
 * Issue with measure method returning incorrect cords
 * https://github.com/software-mansion/react-native-reanimated/issues/7079
 */
export function useTargetMeasurement() {
  const [mounted, setMounted] = useState<boolean>(false);
  const targetRef = useAnimatedRef();

  const measurement = useSharedValue<MeasuredDimensions | null>(null);

  const handleMeasurement = () => {
    runOnUI(() => {
      const result = measure(targetRef);
      if (result === null) {
        return;
      }
      measurement.value = result;
    })();
  };

  useEffect(() => {
    if (mounted) {
      setTimeout(() => {
        handleMeasurement();
      }, 500); // wait to ensure target is mounted
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const onTargetLayout = () => {
    if (!mounted) {
      setMounted(true);
    }
  };

  return {
    measurement,
    targetRef,
    onTargetLayout,
  };
}
