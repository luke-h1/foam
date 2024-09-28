import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
}

const SafeAreaContainer = ({ children }: Props) => {
  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{
        flex: 1,
      }}
    >
      {children}
    </SafeAreaView>
  );
};
export default SafeAreaContainer;
