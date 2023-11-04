import React from 'react';
import Box from './Box';
import Text from './Text';

const NoContent = () => {
  return (
    <Box
      flex={1}
      paddingVertical="xxl"
      alignItems="center"
      justifyContent="center"
    >
      <Text
        color="secondaryText"
        fontFamily="Roobert-SemiBold"
        fontSize={16}
        marginBottom="sToM"
      >
        No content available
      </Text>{' '}
      <Text color="secondaryText">No content is available at this time</Text>
    </Box>
  );
};
export default NoContent;
