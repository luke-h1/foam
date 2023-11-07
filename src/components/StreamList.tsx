import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList, FlashListProps } from '@shopify/flash-list';
import React, { useRef } from 'react';
import { GestureResponderEvent } from 'react-native';
import Box from './Box';
import { PressableProps } from './Pressable';
import { SvgIconProps } from './SVGIcon';
import StreamListCard from './StreamListCard';
import Text from './Text';

export type OptionsIconsProps = {
  pressable?: OptionsIconsPressableProps;
  icon?: SvgIconProps;
};

export type OptionsIconsPressableProps = Omit<PressableProps, 'onPress'> & {
  onPress?: ((event: GestureResponderEvent, user?: unknown) => void) | null;
};

interface StreamListProps extends PressableProps {
  title?: string;
  listTitle?: string;
  size: 'small' | 'medium' | 'large';
  streams: unknown[];
  optionsIconProps?: OptionsIconsProps;
  flashListProps?: Partial<FlashListProps<unknown>>;
}

const StreamList = ({
  title,
  listTitle,
  size,
  streams,
  flashListProps,
  ...props
}: StreamListProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  return (
    <Box flex={1} paddingLeft="sToM">
      {title && (
        <Text variant="title" marginBottom="sToM">
          {title}
        </Text>
      )}
      {listTitle && <Text variant="listTitle">{listTitle}</Text>}
      <FlashList
        {...flashListProps}
        data={streams}
        renderItem={({ item }) => (
          <StreamListCard
            {...props}
            stream={item}
            optionsIconProps={{
              // @ts-expect-error TODO: fix this
              pressable: (e, user) => {
                bottomSheetModalRef.current?.present();
                // setSelectUser(user);
              },
            }}
          />
        )}
        estimatedItemSize={size === 'medium' ? 200 : 83}
        horizontal={size === 'medium'}
      />
    </Box>
    // <StreamListModal ref={bottomSheetModalRef} />
  );
};
export default StreamList;
