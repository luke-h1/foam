const pallete = {
  primaryHighlight: '#93e0f5',
  white: '#fff',
  black: '#000',
  transparent: '#00000000',

  almostWhite: '#F2F2F2',
  almostBlack: '#121212',

  gray1: '#f0f0f0',
  gray2: '#CCCCD8',
  gray3: '#8e8e8e',
  gray4: '#555555',
  gray5: '#262626',
  gray6: '#1a1a1a',
  gray7: '#121212',

  colorHintedGrey1: '0e0e10',
  colorHintedGrey2: '18181b',
  colorHintedGrey3: '1f1f23',
  colorHintedGrey4: '26262c',
  colorHintedGrey5: '323239',
  colorHintedGrey6: '3b3b44',
  colorHintedGrey7: '53535f',
  colorHintedGrey8: '848494',
  colorHintedGrey9: 'adadb8',
  colorHintedGrey10: 'c8c8d0',
  colorHintedGrey11: 'd3d3d9',
  colorHintedGrey12: 'dedee3',
  colorHintedGrey13: 'e6e6ea',
  colorHintedGrey14: 'efeff1',
  colorHintedGrey15: 'f7f7f8',

  highlightedText: '#93e0f5',

  defaultButton: '#61DAFB',

  disabledButtonBackground: '#0095F650',
  disabledButtonText: '#BCC0C480',
  disabledText: '#BCC0C4',

  removeButtonBackground: '#ed0c0c',

  elevatedSeparator: '#343434',
  errorOrDestructive: '#ed4956',
  link: '#e0f1ff',

  twitchPurple: '#61DAFB',
  twitchPurple1: '#040109',
  twitchPurple2: '#0d031c',
  twitchPurple3: '#15052e',
  twitchPurple4: '#24094e',
  twitchPurple5: '#330c6e',
  twitchPurple6: '#451093',
  twitchPurple7: '#5c16c5',
  twitchPurple8: '#772ce8',
  twitchPurple9: '#9147ff',
  twitchPurple10: '#a970ff',
  twitchPurple11: '#bf94ff',
  twitchPurple12: '#d1b3ff',
  twitchPurple13: '#e3d1ff',
  twitchPurple14: '#ede0ff',
  twitchPurple15: '#f3ebff',

  // Default twitch colors
  colorBrandMutedIce: '#d6e4ff',
  colorBrandMutedCupcake: '#ffa3ee',
  colorBrandMutedMint: '#5cffbe',
  colorBrandMutedSky: '#7aa7ff',
  colorBrandMutedBlush: '#ffcdcc',
  colorBrandMutedCanary: '#ebeb00',
  colorBrandMutedSmoke: '#d3d3d9',
  colorBrandMutedLavender: '#d1b3ff',
  colorBrandMutedMustard: '#ffd37a',
  colorBrandMutedEmerald: '#00f593',
  colorBrandMutedCoral: '#ff8280',
  colorBrandMutedOcean: '#1345aa',
  colorBrandAccentGrape: '#5c16c5',
  colorBrandAccentDragonfruit: '#ff38db',
  colorBrandAccentCarrot: '#e69900',
  colorBrandAccentSun: '#ebeb00',
  colorBrandAccentLime: '#00f593',
  colorBrandAccentTurquoise: '#00f0f0',
  colorBrandAccentEggplant: '#451093',
  colorBrandAccentWine: '#ae1392',
  colorBrandAccentSlime: '#00f593',
  colorBrandAccentSeafoam: '#5cffbe',
  colorBrandAccentCherry: '#eb0400',
  colorBrandAccentMarine: '#1f69ff',
  colorBrandAccentSeaweed: '#00a3a3',
  colorBrandAccentPebble: '#848494',
  colorBrandAccentMoon: '#efeff1',
  colorBrandAccentFiji: '#5cffbe',
  colorBrandAccentBlueberry: '#1f69ff',
  colorBrandAccentArctic: '#00f0f0',
  colorBrandAccentHighlighter: '#f5f500',
  colorBrandAccentFlamingo: '#ff38db',
  colorBrandAccentRuby: '#eb0400',
  colorBrandAccentPunch: '#ffcdcc',
  colorBrandAccentCreamsicle: '#ffd37a',
  colorWhite: '#fff',
  colorBlack: '#000',
  colorRed: '#e91916',
  colorRedDarker: '#bb1411',
  colorOrange: '#ffd37a',
  colorYellow: '#ffd37a',
  colorGreen: '#00f593',
  colorGreenDarker: '#00ad96',
  colorBlue: '#1f69ff',
  colorPrimeBlue: '#0e9bd8',
  colorMagenta: '#c53dff',
  colorError: '#eb0400',
  colorWarn: '#ffd37a',
  colorSuccess: '#00f593',
  colorInfo: '#1f69ff',
  colorAccent: '#9147ff',
  colorTransparent: '#transparent',
  // colorOpacB1: rgba(0,0,0,.05)',
  // colorOpacB2: rgba(0,0,0,.08)',
  // colorOpacB3: rgba(0,0,0,.13)',
  // colorOpacB4: rgba(0,0,0,.16)',
  // colorOpacB5: rgba(0,0,0,.22)',
  // colorOpacB6: rgba(0,0,0,.28)',
  // colorOpacB7: rgba(0,0,0,.4)',
  // colorOpacB8: rgba(0,0,0,.5)',
  // colorOpacB9: rgba(0,0,0,.6)',
  // colorOpacB10: rgba(0,0,0,.7)',
  // colorOpacB11: rgba(0,0,0,.75)',
  // colorOpacB12: rgba(0,0,0,.8)',
  // colorOpacB13: rgba(0,0,0,.85)',
  // colorOpacB14: rgba(0,0,0,.9)',
  // colorOpacB15: rgba(0,0,0,.95)',
  // colorOpacW1: hsla(0,0%,100%,.05)',
  // colorOpacW2: hsla(0,0%,100%,.08)',
  // colorOpacW3: hsla(0,0%,100%,.13)',
  // colorOpacW4: hsla(0,0%,100%,.16)',
  // colorOpacW5: hsla(0,0%,100%,.22)',
  // colorOpacW6: hsla(0,0%,100%,.28)',
  // colorOpacW7: hsla(0,0%,100%,.4)',
  // colorOpacW8: hsla(0,0%,100%,.5)',
  // colorOpacW9: hsla(0,0%,100%,.6)',
  // colorOpacW10: hsla(0,0%,100%,.7)',
  // colorOpacW11: hsla(0,0%,100%,.75)',
  // colorOpacW12: hsla(0,0%,100%,.8)',
  // colorOpacW13: hsla(0,0%,100%,.85)',
  // colorOpacW14: hsla(0,0%,100%,.9)',
  // colorOpacW15: hsla(0,0%,100%,.95)',
  // colorOpacP1: rgba(92,22,197,.05)',
  // colorOpacP2: rgba(92,22,197,.1)',
  // colorOpacP3: rgba(92,22,197,.15)',
  // colorOpacP4: rgba(92,22,197,.2)',
  // colorOpacP5: rgba(92,22,197,.25)',
  // colorOpacP6: rgba(92,22,197,.3)',
  // colorOpacP7: rgba(92,22,197,.4)',
  // colorOpacP8: rgba(92,22,197,.5)',
  // colorOpacP9: rgba(92,22,197,.6)',
  // colorOpacP10: rgba(92,22,197,.7)',
  // colorOpacP11: rgba(92,22,197,.75)',
  // colorOpacP12: rgba(92,22,197,.8)',
  // colorOpacP13: rgba(92,22,197,.85)',
  // colorOpacP14: rgba(92,22,197,.9)',
  // colorOpacP15: rgba(92,22,197,.95)',
  colorOrange1: '#050301',
  colorOrange2: '#090601',
  colorOrange3: '#120d02',
  colorOrange4: '#251a04',
  colorOrange5: '#372706',
  colorOrange6: '#453008',
  colorOrange7: '#65470b',
  colorOrange8: '#7c570e',
  colorOrange9: '#9e6900',
  colorOrange10: '#c28100',
  colorOrange11: '#e69900',
  colorOrange12: '#ffb31a',
  colorOrange13: '#ffd37a',
  colorOrange14: '#ffdf9e',
  colorOrange15: '#ffebc2',
  colorYellow1: '#050501',
  colorYellow2: '#090901',
  colorYellow3: '#0e0e02',
  colorYellow4: '#1c1c03',
  colorYellow5: '#292905',
  colorYellow6: '#373706',
  colorYellow7: '#4e4e09',
  colorYellow8: '#60600b',
  colorYellow9: '#7a7a00',
  colorYellow10: '#949400',
  colorYellow11: '#adad00',
  colorYellow12: '#c7c700',
  colorYellow13: '#e0e000',
  colorYellow14: '#ebeb00',
  colorYellow15: '#f5f500',
  colorGreen1: '#010503',
  colorGreen2: '#010906',
  colorGreen3: '#02120c',
  colorGreen4: '#042015',
  colorGreen5: '#063221',
  colorGreen6: '#074029',
  colorGreen7: '#0a5738',
  colorGreen8: '#016b40',
  colorGreen9: '#018852',
  colorGreen10: '#00a865',
  colorGreen11: '#00c274',
  colorGreen12: '#00db84',
  colorGreen13: '#00f593',
  colorGreen14: '#5cffbe',
  colorGreen15: '#a8ffdc',
  colorCyan1: '#010505',
  colorCyan2: '#010909',
  colorCyan3: '#021212',
  colorCyan4: '#042020',
  colorCyan5: '#052e2e',
  colorCyan6: '#073c3c',
  colorCyan7: '#095353',
  colorCyan8: '#0c6a6a',
  colorCyan9: '#018383',
  colorCyan10: '#00a3a3',
  colorCyan11: '#00b8b8',
  colorCyan12: '#00d6d6',
  colorCyan13: '#00f0f0',
  colorCyan14: '#2effff',
  colorCyan15: '#94ffff',
  colorBlue1: '#010205',
  colorBlue2: '#020712',
  colorBlue3: '#040d20',
  colorBlue4: '#071a40',
  colorBlue5: '#0a255c',
  colorBlue6: '#0d3177',
  colorBlue7: '#1345aa',
  colorBlue8: '#1756d3',
  colorBlue9: '#1f69ff',
  colorBlue10: '#528bff',
  colorBlue11: '#7aa7ff',
  colorBlue12: '#a3c2ff',
  colorBlue13: '#c7daff',
  colorBlue14: '#d6e4ff',
  colorBlue15: '#e5eeff',
  colorMagenta1: '#050104',
  colorMagenta2: '#12020f',
  colorMagenta3: '#20041b',
  colorMagenta4: '#37062e',
  colorMagenta5: '#4e0941',
  colorMagenta6: '#650b55',
  colorMagenta7: '#8a0f73',
  colorMagenta8: '#ae1392',
  colorMagenta9: '#c516a5',
  colorMagenta10: '#ff38db',
  colorMagenta11: '#ff75e6',
  colorMagenta12: '#ffa3ee',
  colorMagenta13: '#ffc7f5',
  colorMagenta14: '#ffd6f8',
  colorMagenta15: '#ffe5fa',
  colorRed1: '#050101',
  colorRed2: '#120202',
  colorRed3: '#200404',
  colorRed4: '#3c0807',
  colorRed5: '#530a09',
  colorRed6: '#6e0e0c',
  colorRed7: '#971311',
  colorRed8: '#bb1411',
  colorRed9: '#eb0400',
  colorRed10: '#ff4f4d',
  colorRed11: '#ff8280',
  colorRed12: '#ffaaa8',
  colorRed13: '#ffcdcc',
  colorRed14: '#ffdcdb',
  colorRed15: '#ffe6e5',
  colorTwitter: '#1da1f2',
  colorFacebook: '#3b5998',
  colorReddit: '#ff4500',
  colorSnapchat: '#fffc00',
  colorInstagram: '#405de6',
  colorYoutube: '#cd201f',
  colorPaypal: '#009cde',
  colorPaypalBlue: '#009cde',
  colorPaypalYellow: '#fcc439',
  colorVenmo: '#008cff',
  colorVk: '#45668e',
  colorAmazon: '#fad677',
};

const commonColors = {
  ...pallete,
  icon: pallete.primaryHighlight,
};

export const darkColors = {
  ...commonColors,
  primaryText: pallete.white,
  primaryBackground: pallete.black,
  secondaryText: pallete.gray3,
  secondaryBackground: pallete.almostBlack,
  highlightBackground: pallete.gray5,
  iconDefault: pallete.gray3,
  iconDisabled: pallete.gray4,
  carouselPagination: pallete.gray5,
  languagePickerButton: pallete.gray3,
};

export const lightColors = {
  ...commonColors,
  primaryText: pallete.black,
  primaryBackground: pallete.white,
  secondaryText: pallete.gray2,
  secondaryBackground: pallete.almostWhite,
  highlightBackground: pallete.gray1,
  iconDefault: pallete.primaryHighlight,
  iconDisabled: pallete.gray2,
  carouselPagination: pallete.gray2,
  languagePickerButton: pallete.gray3,
};
