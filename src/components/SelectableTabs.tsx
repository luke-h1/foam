import { BoxProps } from '@shopify/restyle';
import React, { useCallback, useState } from 'react';
import { ScrollView, ViewProps } from 'react-native';
import { Theme } from '../styles/theme';
import Box from './Box';
import SelectableTabItem from './SelectableTabItem';

interface SelectedTabs {
  label: string;
  component: JSX.Element;
}

export type SelectableTabsProps = BoxProps<Theme> &
  ViewProps & {
    data: SelectedTabs[];
    screenProps?: object;
    tabProps?: BoxProps<Theme>;
    tabItemProps?: Partial<SelectedTabs>;
  };

const SelectableTabs = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  screenProps,
  tabProps,
  tabItemProps,
  ...props
}: SelectableTabsProps) => {
  const [activeTab, setActiveTab] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Component = useCallback(() => data[activeTab].component, [activeTab]);

  return (
    <Box flex={1} {...props}>
      <Box>
        <ScrollView
          scrollEnabled={data.length > 4}
          horizontal
          nestedScrollEnabled
        >
          <Box flexDirection="row" marginBottom="s" paddingHorizontal="sToStoM">
            {data &&
              data.map(({ label }, index) => (
                <SelectableTabItem
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  label={label}
                  index={index}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  {...tabItemProps}
                />
              ))}
          </Box>
        </ScrollView>
      </Box>
      <Box flex={1} {...tabProps}>
        <Component />
      </Box>
    </Box>
  );
};

export default SelectableTabs;
