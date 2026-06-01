import { ImageZoomView } from '@app/components/ImageZoomView/ImageZoomView';
import { Button } from '@app/components/ui/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { StyleSheet, View } from 'react-native';

type ImageLightboxProps = {
  uri?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  isPrimaryActionLoading?: boolean;
  emptyLabel?: string;
};

export function ImageLightbox({
  uri,
  primaryActionLabel,
  onPrimaryAction,
  isPrimaryActionLoading = false,
  emptyLabel = 'Image not found',
}: ImageLightboxProps) {
  if (!uri) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText} type='lg' weight='bold'>
          {emptyLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageZoomView uri={uri} />
      </View>

      {primaryActionLabel && onPrimaryAction ? (
        <View style={styles.actionContainer}>
          <Button
            disabled={isPrimaryActionLoading}
            title={isPrimaryActionLoading ? 'Loading...' : primaryActionLabel}
            onPress={onPrimaryAction}
            variant='solid'
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    bottom: 24,
    left: 16,
    position: 'absolute',
    right: 16,
  },
  container: {
    backgroundColor: '#000',
    flex: 1,
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    color: 'white',
  },
  imageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
