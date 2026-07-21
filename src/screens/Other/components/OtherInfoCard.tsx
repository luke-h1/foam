import { ReactNode } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

interface OtherInfoCardProps {
  children?: ReactNode;
  body: string;
  title: string;
}

export function OtherInfoCard({ body, children, title }: OtherInfoCardProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.color.backgroundAltAlpha[scheme],
          borderColor: theme.color.border[scheme],
        },
      ]}
    >
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
