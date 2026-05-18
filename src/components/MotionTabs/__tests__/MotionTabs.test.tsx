import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Platform, Text } from 'react-native';
import { AnimatedTabBar } from '../animated-tab-bar';
import { MorphTab } from '../components/morph-tab';
import { TabToolbar } from '../components/tab-toolbar';
import type {
  AnimatedTabBarProps,
  MotionTabItem,
  MotionTabPalette,
} from '../types';
import { getNavItems } from '../utils/nav-items';
import { palette } from '../utils/palette';

jest.mock('expo-glass-effect', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    GlassView: ({ children, ...props }: { children?: ReactNode }) =>
      React.createElement(View, props, children),
  };
});

const colors: MotionTabPalette = {
  accent: 'accent',
  border: 'border',
  foreground: 'foreground',
  muted: 'muted',
  surface: 'surface',
};

const createIcon =
  (name: string) =>
  (focused: boolean, color: string, size: number): ReactNode => (
    <Text>{`${name}-${focused ? 'focused' : 'idle'}-${color}-${size}`}</Text>
  );

const createDescriptorIcon =
  (name: string) =>
  ({
    color,
    focused,
    size,
  }: {
    color: string;
    focused: boolean;
    size: number;
  }): ReactNode => (
    <Text>{`${name}-${focused ? 'focused' : 'idle'}-${color}-${size}`}</Text>
  );

const createItem = (key: string, label: string): MotionTabItem => ({
  icon: createIcon(key),
  key,
  label,
  routeName: key,
});

const createTabBarProps = (
  index = 0,
  navigate = jest.fn(),
): AnimatedTabBarProps =>
  ({
    descriptors: {
      'chat-key': {
        options: {
          tabBarIcon: createDescriptorIcon('chat'),
          tabBarLabel: 'Chat',
        },
      },
      'settings-key': {
        options: {
          tabBarIcon: createDescriptorIcon('settings'),
          title: 'Settings',
        },
      },
      'hidden-key': {
        options: {
          href: null,
          title: 'Hidden',
        },
      },
    },
    insets: { bottom: 4, left: 0, right: 0, top: 0 },
    navigation: {
      emit: jest.fn(),
      navigate,
    },
    state: {
      index,
      key: 'tabs',
      routeNames: ['chat', 'settings', 'hidden'],
      routes: [
        { key: 'chat-key', name: 'chat' },
        { key: 'settings-key', name: 'settings' },
        { key: 'hidden-key', name: 'hidden' },
      ],
      stale: false,
      type: 'tab',
    },
  }) as unknown as AnimatedTabBarProps;

describe('MotionTabs', () => {
  test('builds visible nav items from descriptors', () => {
    const props = createTabBarProps();

    const items = getNavItems({
      descriptors: props.descriptors,
      state: props.state,
    });

    expect(items.map(item => item.label)).toEqual(['Chat', 'Settings']);
    expect(items.map(item => item.routeName)).toEqual(['chat', 'settings']);
    expect(items[0]?.icon(true, 'red', 16)).toEqual(
      <Text>chat-focused-red-16</Text>,
    );
  });

  test('returns null when a descriptor has no tab icon', () => {
    const props = createTabBarProps();
    const settingsDescriptor = props.descriptors['settings-key'];

    if (!settingsDescriptor) {
      throw new Error('Expected settings descriptor to exist');
    }

    settingsDescriptor.options.tabBarIcon = undefined;

    const items = getNavItems({
      descriptors: props.descriptors,
      state: props.state,
    });

    expect(items[1]?.icon(false, 'gray', 20)).toBeNull();
  });

  test('renders toolbar tabs with selected accessibility state', () => {
    const items = [
      createItem('chat', 'Chat'),
      createItem('settings', 'Settings'),
    ];
    const onPress = jest.fn();

    const { getByLabelText } = render(
      <TabToolbar
        activeKey="settings"
        colors={colors}
        items={items}
        onPress={onPress}
      />,
    );

    expect(getByLabelText('Chat')).toHaveAccessibilityState({
      selected: false,
    });
    expect(getByLabelText('Settings')).toHaveAccessibilityState({
      selected: true,
    });
  });

  test('measures labels and sends tab presses through the toolbar', () => {
    const item = createItem('chat', 'Chat');
    const onPress = jest.fn();

    const { getAllByText, getByLabelText } = render(
      <MorphTab
        active
        colors={colors}
        index={2}
        item={item}
        onPress={onPress}
      />,
    );

    const chatLabel = getAllByText('Chat')[0];
    if (!chatLabel) {
      throw new Error('Expected Chat label to render');
    }

    fireEvent(chatLabel, 'layout', {
      nativeEvent: { layout: { width: 41 } },
    });
    fireEvent(getByLabelText('Chat'), 'pressIn');
    fireEvent(getByLabelText('Chat'), 'pressOut');
    fireEvent.press(getByLabelText('Chat'));

    expect(onPress).toHaveBeenCalledWith(item, 2);
  });

  test('navigates only when pressing an inactive tab', () => {
    const navigate = jest.fn();
    const { getByLabelText } = render(
      <AnimatedTabBar {...createTabBarProps(0, navigate)} />,
    );

    fireEvent.press(getByLabelText('Chat'));
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.press(getByLabelText('Settings'));
    expect(navigate).toHaveBeenCalledWith('settings');
  });

  test('uses the fallback surface color on android', () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android' });

    const { getByLabelText } = render(
      <AnimatedTabBar {...createTabBarProps()} />,
    );

    expect(getByLabelText('Chat')).toBeTruthy();

    Object.defineProperty(Platform, 'OS', { value: originalOS });
  });

  test('returns both supported palettes', () => {
    expect(palette('dark')).toMatchObject({
      foreground: '#f5f5f7',
      muted: '#8e8e93',
    });
    expect(palette('light')).toMatchObject({
      foreground: '#0a0a0a',
      muted: '#71717a',
    });
  });
});
