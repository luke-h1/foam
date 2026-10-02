import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@app/components/ui/text/text';
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
      <Text type='body' color='gray.textLow' style={styles.copy}>
        {body}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    marginHorizontal: theme.space16,
    padding: theme.space20,
  },
  copy: {
    marginTop: theme.space12,
  },
});
