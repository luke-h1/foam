import { EMOJI } from '@app/components/EmojiPicker/config';
import EmojiPicker from '@app/components/EmojiPicker/EmojiPicker';
import { DevToolsStackScreenProps } from '@app/navigators';
import { logger } from '@app/utils/logger';
import { FC } from 'react';
import { SafeAreaView, View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export const EmotesScreen: FC<DevToolsStackScreenProps<'Emotes'>> = ({
  route: { params },
}) => {
  logger.main.info(params);
  const { styles } = useStyles(stylesheet);
  return (
    <View style={styles.container}>
      <EmojiPicker data={EMOJI} />
    </View>
  );
};
const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    paddingVertical: 84,
    alignItems: 'center',
  },
}));
