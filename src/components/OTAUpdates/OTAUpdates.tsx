import { OTAUpdateModal } from '@app/components/OTAUpdates/OTAUpdateModal';
import { useAuthContext } from '@app/context/AuthContext';
import { useOTAUpdates } from '@app/hooks/useOTAUpdates';

export function OTAUpdates() {
  const { ready } = useAuthContext();

  const { updateState, modalVisible, onApply, onDismiss } = useOTAUpdates({
    isReady: ready,
  });

  return (
    <OTAUpdateModal
      visible={modalVisible}
      updateState={updateState}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onApply={onApply}
      onDismiss={onDismiss}
    />
  );
}
