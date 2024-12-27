import { spacing } from '@app/styles';
import * as Application from 'expo-application';
import { useUpdates } from 'expo-updates';
import { View, ViewStyle } from 'react-native';
import pkg from '../../package.json';
import { Text } from './ui/Text';

export default function BuildDetails() {
  const updates = useUpdates();

  const updatedId = updates?.currentlyRunning?.updateId;

  return (
    <View style={$container}>
      <Text testID="BuildDetails-nativeAppVersion">
        v{Application.nativeApplicationVersion}
      </Text>
      <Text testID="BuildDetails-nativeBuildVersion">
        Native build version: {Application.nativeBuildVersion}
      </Text>
      <Text testID="BuildDetails-pkgVersion">
        package version:{pkg.version}
      </Text>
      {updatedId ? (
        <Text testID="BuildDetails-updatedId">{updatedId}</Text>
      ) : null}
    </View>
  );
}

const $container: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: spacing.medium,
  paddingBottom: spacing.small,
};
