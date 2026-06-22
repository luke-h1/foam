import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

interface OtherInfoCardProps {
  children?: ReactNode;
  body: string;
  title: string;
}

export function OtherInfoCard({ body, children, title }: OtherInfoCardProps) {
  return (
    <View style={styles.card}>
      <Text weight='semibold'>{title}</Text>
      <Text type='sm' color='gray.textLow' style={styles.copy}>
        {body}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    marginHorizontal: theme.space20,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space20,
  },
  copy: {
    marginTop: theme.space12,
  },
});
