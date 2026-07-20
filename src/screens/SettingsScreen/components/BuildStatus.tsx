import { StyleSheet, View } from 'react-native';

import * as Updates from 'expo-updates';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { getBuildInfoLabel } from '@app/utils/version/buildInfoLabel';

export function BuildStatus() {
  const onOtaUpdate = Boolean(Updates.updateId);

  return (
    <View style={styles.buildContainer}>
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: onOtaUpdate
              ? theme.color.success.dark
              : theme.colorGrey,
          },
        ]}
      />
      <Text type='xs' weight='medium' color='gray.textLow'>
        {getBuildInfoLabel()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buildContainer: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  statusDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
});
