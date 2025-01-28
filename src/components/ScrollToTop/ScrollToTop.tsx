import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Typography } from '../Typography';

interface Props {
  onPress: () => void;
}

export function ScrollToTop({ onPress }: Props) {
  const { styles } = useStyles(stylesheet);
  return (
    <Button style={styles.button} onPress={onPress}>
      <Typography weight="bold">TOP</Typography>
    </Button>
  );
}

const stylesheet = createStyleSheet(() => ({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 10,
  },
}));
