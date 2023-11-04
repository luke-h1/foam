import { useTheme } from '@shopify/restyle';
import { ReactNode } from 'react';
import {
  SafeAreaView,
  SafeAreaViewProps,
} from 'react-native-safe-area-context';
import { Theme } from '../styles/theme';

interface SafeAreaContainerProps extends SafeAreaViewProps {
  children: ReactNode;
}

const SafeAreaContainer = ({ children }: SafeAreaContainerProps) => {
  const theme = useTheme<Theme>();

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        flex: 1,
        backgroundColor: theme.colors.primaryBackground,
      }}
    >
      {children}
    </SafeAreaView>
  );
};
export default SafeAreaContainer;
