import { Children, isValidElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { theme } from '@app/styles/themes';

import { SymbolView } from '../Icon/Icon';
import { Text } from '../Text/Text';
import {
  FormActionRowProps,
  FormInfoRowProps,
  FormRawRowProps,
  FormScreenProps,
  FormSectionProps,
} from './Form.types';

export function FormScreen({ children }: FormScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      contentInsetAdjustmentBehavior='automatic'
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function FormSection({ children, title }: FormSectionProps) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text
          type='xs'
          weight='semibold'
          color='gray.textLow'
          style={styles.sectionTitle}
        >
          {title}
        </Text>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function FormInfoRow({ label, value }: FormInfoRowProps) {
  return (
    <View style={styles.row}>
      <Text weight='semibold' color='gray' style={styles.rowLabel}>
        {label}
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text type='xs' color='gray.textLow' selectable>
          {String(value)}
        </Text>
      ) : (
        <View style={styles.rowValueWrapper}>{value}</View>
      )}
    </View>
  );
}

export function FormActionRow({ onPress, title, icon }: FormActionRowProps) {
  return (
    <PressableArea style={styles.pressableFill} onPress={onPress}>
      <View style={styles.actionRow}>
        {icon ? (
          <SymbolView name={icon} size={20} tintColor={theme.colorWhite} />
        ) : null}
        <Text weight='semibold' color='gray' style={styles.actionLabel}>
          {title}
        </Text>
        <SymbolView
          name='chevron.right'
          size={18}
          tintColor={theme.colorGreyAlpha}
        />
      </View>
    </PressableArea>
  );
}

export function FormRawRow({ children }: FormRawRowProps) {
  const child = Children.toArray(children).find(isValidElement) ?? null;
  return <View style={styles.sectionBody}>{child}</View>;
}

const styles = StyleSheet.create({
  actionLabel: {
    flex: 1,
  },
  actionRow: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
  },
  pressableFill: {
    alignSelf: 'stretch',
  },
  row: {
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: 14,
  },
  rowLabel: {
    minWidth: 0,
  },
  rowValueWrapper: {
    flexShrink: 1,
  },
  screen: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  screenContent: {
    gap: theme.space24,
    paddingBottom: theme.space56,
    paddingTop: theme.space16,
  },
  section: {
    gap: theme.space8,
  },
  sectionBody: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    marginHorizontal: theme.space16,
    overflow: 'hidden',
  },
  sectionTitle: {
    letterSpacing: 0.5,
    paddingHorizontal: theme.space16,
    textTransform: 'uppercase',
  },
});
