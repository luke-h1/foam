import { StyleSheet } from 'react-native';

import { ICON_BOX, LABEL_PAD, TAB_HEIGHT } from './constants';

const tabStyles = StyleSheet.create({
  fixedLabel: {
    flexShrink: 0,
  },
  holdCircle: {
    borderRadius: 18,
    height: 36,
    left: (ICON_BOX - 36) / 2,
    position: 'absolute',
    top: (TAB_HEIGHT - 36) / 2,
    width: 36,
  },
  iconBox: {
    height: TAB_HEIGHT,
    width: ICON_BOX,
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureLabel: {
    left: -10000,
    opacity: 0,
    position: 'absolute',
    top: -10000,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  tabLabelWrap: {
    height: TAB_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingRight: LABEL_PAD,
  },
  tabMorph: {
    alignItems: 'center',
    borderRadius: TAB_HEIGHT / 2,
    flexDirection: 'row',
    height: TAB_HEIGHT,
    overflow: 'hidden',
  },
});

export { tabStyles };
