import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { StyleSheet, View } from 'react-native';

export function EditorialSectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.header}>
      {eyebrow ? (
        <Text
          type='xs'
          weight='semibold'
          color='gray.textLow'
          style={styles.eyebrow}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text type='xl' weight='bold'>
        {title}
      </Text>
      {subtitle ? (
        <Text type='sm' color='gray.textLow' style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    letterSpacing: 1.1,
    marginBottom: theme.space8,
    textTransform: 'uppercase',
  },
  header: {
    marginBottom: theme.space20,
    paddingHorizontal: theme.space20,
  },
  subtitle: {
    marginTop: theme.space8,
    maxWidth: 320,
  },
});
