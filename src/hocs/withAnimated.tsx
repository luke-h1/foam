import { Component, ComponentClass, ComponentType, ReactNode } from 'react';
import Animated, { AnimateProps } from 'react-native-reanimated';

export function withAnimated<Props extends object>(
  WrappedComponent: ComponentType<Props>,
): ComponentClass<AnimateProps<Props>> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  // eslint-disable-next-line react/prefer-stateless-function
  class WithAnimated extends Component<Props> {
    // eslint-disable-next-line react/static-property-placement
    static displayName = `WithAnimated(${displayName})`;

    render(): ReactNode {
      return <WrappedComponent {...this.props} />;
    }
  }

  return Animated.createAnimatedComponent(WithAnimated);
}
