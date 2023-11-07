import { useTheme } from '@shopify/restyle';
import React, { Dispatch, SetStateAction } from 'react';
import { Theme } from '../styles/theme';
import Pressable, { PressableProps } from './Pressable';
import Text from './Text';

interface SelectableTabItemProps extends PressableProps {
  label: string;
  index: number;
  activeTab: number;
  gap?: PressableProps['gap'];
  setActiveTab: Dispatch<SetStateAction<number>>;
}

const SelectableTabItem = ({
  label,
  index,
  activeTab,
  setActiveTab,
  gap,
  ...props
}: SelectableTabItemProps) => {
  const isActive = index === activeTab;
  const theme = useTheme<Theme>();

  return (
    <Pressable
      onPress={() => setActiveTab(index)}
      paddingVertical="sToStoM"
      borderBottomWidth={3}
      borderBottomColor={isActive ? 'primaryHighlight' : undefined}
      // @ts-expect-error - todo
      style={{
        marginRight: gap || theme.spacing.l,
      }}
      {...props}
    >
      <Text
        fontSize={16}
        fontFamily="Roobert-SemiBold"
        color={isActive ? 'primaryHighlight' : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default SelectableTabItem;
