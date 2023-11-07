import React, { ReactNode } from 'react';
import LeftArrowIcon from '../../assets/images/left-arrow.svg';
import { Theme } from '../styles/theme';
import Box from './Box';
import Pressable from './Pressable';
import SVGIcon from './SVGIcon';
import Text from './Text';

interface ScreenheaderProps {
  showGoBackTouchable?: boolean;
  showGoBackLabel?: boolean;
  goBackIconColor?: keyof Theme['colors'];
  title?: string | ReactNode;
  rightElement?: ReactNode;
}

const ScreenHeader = ({
  showGoBackTouchable,
  showGoBackLabel,
  goBackIconColor,
  title,
  rightElement,
}: ScreenheaderProps) => {
  return (
    <Box
      testID="screenHeader"
      paddingVertical="s"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="primaryBackground"
    >
      {showGoBackTouchable && (
        <Pressable
          testID="goBackButton"
          onPress={() => {}}
          padding="s"
          flexDirection="row"
          alignItems="center"
        >
          <SVGIcon
            testID="goBackIcon"
            icon={LeftArrowIcon}
            color={goBackIconColor}
            width={26}
            height={26}
          />
          {showGoBackLabel && (
            <Text
              testID="goBackLabel"
              marginLeft="xxs"
              fontSize={18}
              color="defaultButton"
            >
              Back
            </Text>
          )}
        </Pressable>
      )}
      {title && (
        <Text testID="title" fontSize={18} fontFamily="Roboto-Bold">
          {title}
        </Text>
      )}
      <Box minWidth={42}>{rightElement}</Box>
    </Box>
  );
};

export default ScreenHeader;
