import { BrandIcon } from '@app/components/BrandIcon';
import { Image } from '@app/components/Image';
import { Typography } from '@app/components/Typography';
import { ParsedPart } from '@app/utils';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface StvEmoteEventProps {
  part: ParsedPart<'stv_emote_added' | 'stv_emote_removed'>;
}

export function StvEmoteEvent({ part }: StvEmoteEventProps) {
  const added = part.type === 'stv_emote_added';
  const removed = part.type === 'stv_emote_removed';

  styles.useVariants({
    added,
    removed,
  });

  const content = part.stvEvents?.data;

  const status = removed ? 'Removed' : 'Added';

  return (
    <View style={styles.container}>
      <View style={styles.notice}>
        <View style={styles.noticeHeader}>
          <BrandIcon name="stv" size="lg" />
          <Typography style={styles.status}>
            <Typography color={removed ? 'red' : 'green'}>{status}</Typography>
            <Typography> Emote</Typography>
          </Typography>
          <Typography style={styles.userText}>user</Typography>
        </View>
      </View>
      <View style={styles.content}>
        <Image
          source={content.url}
          style={styles.emoteImage}
          transition={20}
          contentFit="contain"
        />
        <View style={styles.textContainer}>
          <Typography style={styles.emoteName}>{content.name}</Typography>
          {content.creator && (
            <Typography size="xs" color="gray.accentHover">
              By {content.creator}
            </Typography>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  stvLogo: {
    width: 30,
    height: 30,
  },
  noticeHeader: {
    backgroundColor: theme.colors.gray.uiActive,
    width: '100%',
    flexDirection: 'row',
    paddingInline: theme.spacing.sm,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  container: {
    width: '100%',
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.gray.uiActive,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: theme.colors.accent.accent,
    borderRightColor: theme.colors.accent.accent,
    variants: {
      added: {
        true: {
          borderLeftColor: theme.colors.green.accent,
          borderRightColor: theme.colors.green.accent,
        },
      },
      removed: {
        true: {
          borderLeftColor: theme.colors.red.accent,
          borderRightColor: theme.colors.red.accent,
        },
      },
    },
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  emoteImage: {
    width: 140,
    height: 50,
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  emoteName: {
    fontSize: theme.font.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  status: {
    marginLeft: theme.spacing.md,
  },
  userText: {
    marginLeft: 'auto',
    color: theme.colors.gray.accentHover,
    fontSize: theme.font.fontSize.xs,
  },
}));
