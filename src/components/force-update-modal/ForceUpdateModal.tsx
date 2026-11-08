import { Modal as RNModal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SymbolView } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';
import { openStore } from '@app/utils/app-update/openStore';

import { ActionButton } from '../action-button/ActionButton';
import { UPDATE_REQUIRED_BODY, UPDATE_REQUIRED_TITLE } from './constants';
import { useArmedWhenIdle } from './hooks/use-armed-when-idle';
import { useUpdateRequirement } from './hooks/use-update-requirement';

export function ForceUpdateModal() {
  const armed = useArmedWhenIdle();

  return armed ? <ForceUpdateModalContent /> : null;
}

function ForceUpdateModalContent() {
  const { updateRequired, currentVersion, minimumVersion } =
    useUpdateRequirement();

  const insets = useSafeAreaInsets();

  return (
    <RNModal
      animationType='fade'
      transparent
      visible={updateRequired}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.card}>
          <SymbolView
            name='arrow.down.app'
            size={44}
            tintColor={theme.color.accent.dark}
          />

          <Text type='title3' align='center' style={styles.title}>
            {UPDATE_REQUIRED_TITLE}
          </Text>

          <Text
            color='gray.textLow'
            type='subhead'
            align='center'
            style={styles.subtitle}
          >
            {UPDATE_REQUIRED_BODY}
          </Text>

          <View style={styles.versionInfo}>
            <View style={styles.versionRow}>
              <Text color='gray.textLow' type='subhead'>
                Current version
              </Text>
              <Text type='subhead' weight='semibold' tabular>
                {currentVersion}
              </Text>
            </View>
            <View style={styles.versionRow}>
              <Text color='gray.textLow' type='subhead'>
                Minimum required
              </Text>
              <Text type='subhead' weight='semibold' tabular>
                {minimumVersion}
              </Text>
            </View>
          </View>

          <ActionButton
            title='Update now'
            onPress={openStore}
            style={styles.updateButton}
          />
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.color.surface.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.xl,
    maxWidth: 340,
    padding: theme.space28,
    width: '100%',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: theme.color.scrimStrong.dark,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
  title: {
    marginTop: theme.space16,
  },
  subtitle: {
    marginBottom: theme.space20,
    marginTop: theme.space8,
  },
  updateButton: {
    alignSelf: 'stretch',
  },
  versionInfo: {
    alignSelf: 'stretch',
    gap: theme.space8,
    marginBottom: theme.space24,
  },
  versionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
