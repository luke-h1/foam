import React from 'react';

const ScreenComponent = ({
  children,
  ...props
}: {
  children?: React.ReactNode;
}) => React.createElement('View', props, children);

export const enableFreeze = jest.fn();
export const enableScreens = jest.fn();
export const Screen = ScreenComponent;
export const ScreenContainer = ScreenComponent;
export const ScreenStack = ScreenComponent;
export const ScreenStackItem = ScreenComponent;
