import { colors, spacing } from '@app/styles';
import { ViewStyle, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast, { BaseToast, ToastConfig } from 'react-native-toast-message';
import { $baseSecondaryStyle, $baseStyle } from './ui/Text';

export default function CustomToast() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const width = screenWidth - spacing.extraSmall * 2;

  const toastConfig: ToastConfig = {
    // eslint-disable-next-line react/no-unstable-nested-components
    success: props => (
      <BaseToast
        {...props}
        contentContainerStyle={$toastContainer}
        style={[$toast, { width }]}
        text1Style={$baseStyle}
        text2Style={$baseSecondaryStyle}
      />
    ),
  };

  return <Toast config={toastConfig} topOffset={insets.top} />;
}

const $toast: ViewStyle = {
  backgroundColor: colors.palette.neutral400,
  borderLeftWidth: 0,
  borderRadius: spacing.extraSmall,
};

const $toastContainer: ViewStyle = {
  paddingHorizontal: spacing.large,
  paddingVertical: spacing.medium,
};
