import { Flex, FlexProps } from '@app/components/Flex';
import React from 'react';
import { FlatList, ViewProps } from 'react-native';

export type FlexLoaderProps = FlexProps &
  ViewProps & {
    repeat?: number;
  };

export default function FlexLoader({
  repeat = 1,
  backgroundColor = '$neutral3',
  borderRadius = '$rounded12',
  width = '100%',
  height,
  ...props
}: FlexLoaderProps) {
  return (
    <Flex>
      <FlatList
        data={new Array(repeat).fill(null).map((_, i) => i)}
        renderItem={() => (
          <Flex
            backgroundColor={backgroundColor}
            borderRadius={borderRadius}
            height={height}
            width={width}
            {...props}
          />
        )}
        keyExtractor={(_item, index) => index.toString()}
      />
    </Flex>
  );
}
