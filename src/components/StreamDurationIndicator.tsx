import React, { ReactNode } from 'react';
import Box from './Box';

interface Props {
  children: ReactNode;
}

const StreamDurationIndicator = ({ children }: Props) => {
  return (
    <Box
      backgroundColor="primaryBackground"
      borderRadius="xxs"
      paddingVertical="xxxs"
      paddingHorizontal="xxs"
    >
      {children}
    </Box>
  );
};
export default StreamDurationIndicator;
