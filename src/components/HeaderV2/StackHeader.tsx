import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { HeaderV2 } from './HeaderV2';

type Props = NativeStackHeaderProps | BottomTabHeaderProps;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function StackHeader({ navigation, options, ...props }: Props) {
  const back = 'back' in props ? Boolean(props.back?.title) : false;
  const modal = 'presentation' in options && options.presentation === 'modal';

  return (
    <HeaderV2
      back={back}
      left={options.headerLeft?.({ canGoBack: back })}
      modal={modal}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      right={options.headerRight?.({ canGoBack: back })}
      sticky={options.headerTransparent === false}
      title={
        typeof options.headerTitle === 'function'
          ? options.headerTitle({
              children: options.title ?? '',
            })
          : options.title
      }
    />
  );
}
