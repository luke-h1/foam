import { Typography } from '@app/components';
import * as Application from 'expo-application';
import { useUpdates } from 'expo-updates';
import { ScrollView, View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.row}>
      <Typography style={styles.label}>{label}</Typography>
      <Typography style={styles.value}>{value}</Typography>
    </View>
  );
}

interface TableData {
  title: string;
  data: Record<string, string>;
}

export function Diagnostics() {
  const { styles } = useStyles(stylesheet);
  const { isUpdateAvailable, isUpdatePending } = useUpdates();

  const sections: TableData[] = [
    {
      title: 'Application',
      data: {
        Name: Application.applicationName ?? '',
        Version: Application.nativeApplicationVersion ?? '',
        'Build Number': Application.nativeBuildVersion ?? '',
        'Build ID': process.env.EAS_BUILD_ID ?? '',
        'Commit Hash': process.env.EAS_BUILD_GIT_COMMIT_HASH ?? '',
      },
    },
    {
      title: 'Updates',
      data: {
        'Update Available': isUpdateAvailable ? 'Yes' : 'No',
        'Update Pending': isUpdatePending ? 'Yes' : 'No',
      },
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.table}>
        {sections.map(({ title, data }) => (
          <View key={title} style={styles.section}>
            <View style={[styles.row, styles.headerRow]}>
              <Typography style={styles.headerText}>{title}</Typography>
            </View>
            {Object.entries(data).map(([key, value]) => (
              <InfoRow key={key} label={key} value={value as string} />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  table: {
    overflow: 'hidden',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerRow: {
    borderBottomWidth: 2,
  },
  headerText: {
    fontWeight: 'bold',
  },
  label: {
    flex: 1,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  value: {
    flex: 2,
  },
}));
