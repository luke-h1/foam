import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { useRef } from 'react';
import MoonIcon from '../../assets/images/moon_filled.svg';
import SettingsIcon from '../../assets/images/settings.svg';
import BottomModal from './BottomModal';
import BottomModalItem, { BottomModalItemSizes } from './BottomModalItem';
import Box from './Box';
import Button, { ButtonColors, ButtonSizes } from './Button';
import Image from './Image';
import Pressabble from './Pressable';
// import SVGIcon from './SVGIcon';

const NavBar = () => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  return (
    <>
      <Box padding="sToM" flexDirection="row" justifyContent="space-between">
        <Box flexDirection="row" alignItems="center">
          <Pressabble onPress={() => bottomSheetModalRef.current?.present()}>
            <Image
              source={{ uri: 'https://picsum.photos/200/300' }}
              width={28}
              height={28}
              borderRadius="xl"
            />
          </Pressabble>
          {/* <SVGIcon
            icon={Notification2}
            width={26}
            height={26}
            color="primaryText"
            marginLeft="sToM"
          />
          <SVGIcon
            icon={Messages}
            width={26}
            height={26}
            color="primaryText"
            marginLeft="sToM"
          /> */}
        </Box>
        <Button
          size={ButtonSizes.Small}
          color={ButtonColors.PrimaryOutlineText}
          isBold={false}
          textProps={{
            flex: 0,
            fontFamily: 'Roobert-Medium',
          }}
        >
          create
        </Button>
      </Box>
      <BottomModal
        ref={bottomSheetModalRef}
        snapPoints={['92%']}
        title="Account"
      >
        <BottomModalItem
          size={BottomModalItemSizes.Medium}
          isFirst
          onPress={() => {
            bottomSheetModalRef.current?.dismiss();
            // navigate to profile screen
          }}
        >
          My Profile
        </BottomModalItem>
        <BottomModalItem
          icon={SettingsIcon}
          size={BottomModalItemSizes.Medium}
          showRightArrow
        >
          Settings
        </BottomModalItem>
        <BottomModalItem
          icon={MoonIcon}
          size={BottomModalItemSizes.Medium}
          showRightArrow
          isLast
        >
          Appearance
        </BottomModalItem>
      </BottomModal>
    </>
  );
};

export default NavBar;
