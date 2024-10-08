import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native';

interface Props {
  children: ReactNode;
}

export default function SafeAreaContainer({ children }: Props) {
  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
}
