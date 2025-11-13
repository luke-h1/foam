import React from 'react';
import { View, Text } from 'react-native';

// Mock all icon sets
const createMockIconSet = (name: string) => {
  const IconComponent = ({ ...props }: { [key: string]: unknown }) => (
    <View testID={`icon-${name}`} {...props}>
      <Text>{name}</Text>
    </View>
  );
  IconComponent.displayName = name;
  return IconComponent;
};

export default {
  AntDesign: createMockIconSet('AntDesign'),
  Entypo: createMockIconSet('Entypo'),
  Ionicons: createMockIconSet('Ionicons'),
  SimpleLineIcons: createMockIconSet('SimpleLineIcons'),
  Feather: createMockIconSet('Feather'),
  MaterialIcons: createMockIconSet('MaterialIcons'),
  MaterialCommunityIcons: createMockIconSet('MaterialCommunityIcons'),
  FontAwesome: createMockIconSet('FontAwesome'),
  FontAwesome5: createMockIconSet('FontAwesome5'),
  FontAwesome6: createMockIconSet('FontAwesome6'),
  Foundation: createMockIconSet('Foundation'),
  EvilIcons: createMockIconSet('EvilIcons'),
  Octicons: createMockIconSet('Octicons'),
  Zocial: createMockIconSet('Zocial'),
  // Add any other icon sets you use
};

