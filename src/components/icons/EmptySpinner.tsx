import { Circle, Svg } from 'react-native-svg';
import createIcon from '../../hocs/createIcon';

export const [EmptySpinner, AnimatedEmptySpinner] = createIcon({
  name: 'EmptySpinner',
  getIcon: props => (
    <Svg fill="none" viewBox="0 0 20 20" {...props}>
      <Circle
        cx="10"
        cy="10"
        r="8"
        stroke="currentColor"
        strokeOpacity="0.24"
        strokeWidth="3"
      />
    </Svg>
  ),
});
