import { BlurView } from '@react-native-community/blur';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';

const CustomTabBar = (props: BottomTabBarProps) => {
  return (
    <BlurView
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      }}
      blurType="dark"
      blurAmount={10}
      blurRadius={25}
      overlayColor="transparent"
    >
      <BottomTabBar {...props} />
    </BlurView>
  );
};

export default CustomTabBar;
