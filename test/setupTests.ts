/* eslint-disable no-undef */
/* eslint-disable no-restricted-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-require-imports */
import '@testing-library/jest-native/extend-expect';
import 'react-native-url-polyfill/auto';
import 'cross-fetch/polyfill';
import '@app/i18n/i18next';

import * as ReactNative from 'react-native';
import type { ReactNode } from 'react';

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { configure as configureReassure } from 'reassure';
import { TextDecoder, TextEncoder } from 'util';

import mockFile from '../__mocks__/mockFile';

// Polyfill TextEncoder/TextDecoder for Node.js environment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

configureReassure({ testingLibrary: 'react-native' });

/**
 * The Skia jest mock renders components as plain Views but routes imperative
 * calls (Skia.Path.Make etc.) to global.CanvasKit, which is never loaded in
 * jsdom. Nothing is actually drawn in tests, so a call-through proxy is enough.
 */
function canvasKitStub(): any {
  return new Proxy(function () {}, {
    get: (_target, prop) =>
      prop === Symbol.toPrimitive ? () => 0 : canvasKitStub(),
    construct: () => canvasKitStub(),
    apply: () => canvasKitStub(),
  });
}
(global as any).CanvasKit = canvasKitStub();

jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('react-native-vector-icons');

jest.mock('@expo/ui/community/masked-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaskedView: ({ maskElement, children, ...props }: any) =>
      React.createElement(
        View,
        { testID: 'masked-view', ...props },
        maskElement,
        children,
      ),
  };
});

jest.mock('@expo/ui/swift-ui', () => {
  const { useRef } = jest.requireActual('react');
  return {
    ...jest.requireActual('@expo/ui/swift-ui'),
    useNativeState: (initial: unknown) => useRef({ value: initial }).current,
  };
});

/**
 * Polyfill for setImmediate which Sentry uses under the hood
 */
global.setImmediate =
  global.setImmediate ||
  ((callback: (...args: any[]) => void, ...args: any) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    setTimeout(callback, 0, ...args));

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  const { EventEmitter } = require('events');
  return {
    __esModule: true,
    default: EventEmitter,
  };
});

jest.mock('react-native-worklets');

const createReactNativeHostMock = (hostName: string) => {
  const React = require('react');

  return React.forwardRef(
    (
      {
        children,
        ...props
      }: {
        children?: React.ReactNode;
      },
      ref: React.Ref<unknown>,
    ) =>
      React.createElement(
        hostName,
        ref == null ? props : { ...props, ref },
        children,
      ),
  );
};

jest.mock('react-native/Libraries/Text/Text', () => ({
  __esModule: true,
  default: createReactNativeHostMock('Text'),
}));

jest.mock('react-native/Libraries/Components/Button', () => ({
  __esModule: true,
  default: createReactNativeHostMock('Button'),
}));

jest.mock('react-native/Libraries/Components/TextInput/TextInput', () => ({
  __esModule: true,
  default: createReactNativeHostMock('TextInput'),
}));

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  const passthroughComponent = ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
  }) => React.createElement(View, props, children);
  const createGesture = () => {
    const gesture: Record<string, unknown> = {};
    const chainable = () => gesture;
    [
      'activeOffsetX',
      'activeOffsetY',
      'direction',
      'enabled',
      'failOffsetX',
      'failOffsetY',
      'maxDuration',
      'maxPointers',
      'minPointers',
      'numberOfTaps',
      'onBegin',
      'onEnd',
      'onFinalize',
      'onStart',
      'onTouchesDown',
      'onTouchesUp',
      'onUpdate',
      'requireExternalGestureToFail',
      'runOnJS',
      'simultaneousWithExternalGesture',
    ].forEach(method => {
      gesture[method] = chainable;
    });
    return gesture;
  };

  return {
    __esModule: true,
    Directions: {
      DOWN: 4,
      LEFT: 2,
      RIGHT: 1,
      UP: 8,
    },
    Gesture: {
      Exclusive: (...gestures: unknown[]) => gestures,
      Fling: createGesture,
      Pan: createGesture,
      Pinch: createGesture,
      Race: (...gestures: unknown[]) => gestures,
      Simultaneous: (...gestures: unknown[]) => gestures,
      Tap: createGesture,
    },
    GestureDetector: passthroughComponent,
    GestureHandlerRootView: passthroughComponent,
    Pressable: passthroughComponent,
    RectButton: passthroughComponent,
    ScrollView: passthroughComponent,
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  const animatedComponent = React.forwardRef(
    (
      {
        children,
        ...props
      }: {
        children?: React.ReactNode;
      },
      ref: React.Ref<unknown>,
    ) => React.createElement(View, { ...props, ref }, children),
  );
  const identityAnimation = (
    value: unknown,
    _config?: unknown,
    callback?: (finished?: boolean) => void,
  ) => {
    callback?.(true);
    return value;
  };

  return {
    __esModule: true,
    default: {
      call: () => {},
      createAnimatedComponent: (component: unknown) => component,
      FlatList: animatedComponent,
      Image: animatedComponent,
      ScrollView: animatedComponent,
      Text: animatedComponent,
      View: animatedComponent,
    },
    cancelAnimation: jest.fn(),
    createAnimatedComponent: (component: unknown) => component,
    Easing: {
      bezier: jest.fn(() => jest.fn()),
      cubic: jest.fn(),
      in: jest.fn(easing => easing),
      inOut: jest.fn(easing => easing),
      linear: jest.fn(),
      out: jest.fn(easing => easing),
    },
    Extrapolation: {
      CLAMP: 'clamp',
      EXTEND: 'extend',
      IDENTITY: 'identity',
    },
    interpolate: jest.fn((value: unknown) => value),
    interpolateColor: jest.fn((value: unknown) => value),
    makeMutable: (value: unknown) => {
      const sv = {
        value,
        get: () => sv.value,
        set: (v: unknown) => {
          sv.value = v;
        },
      };
      return sv;
    },
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    runOnUI: (fn: (...args: unknown[]) => unknown) => fn,
    useAnimatedReaction: jest.fn(),
    useAnimatedRef: () => ({ current: null }),
    useFrameCallback: jest.fn(() => ({ setActive: jest.fn() })),
    useAnimatedScrollHandler: (handler: unknown) => handler,
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useDerivedValue: (updater: () => unknown) => {
      const sv = {
        value: updater(),
        get: () => sv.value,
        set: (v: unknown) => {
          sv.value = v;
        },
      };
      return sv;
    },
    useSharedValue: (value: unknown) => {
      const sv = {
        value,
        get: () => sv.value,
        set: (v: unknown) => {
          sv.value = v;
        },
      };
      return sv;
    },
    withDelay: (_delay: number, value: unknown) => value,
    withRepeat: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values.at(-1),
    withSpring: identityAnimation,
    withTiming: identityAnimation,
    ...Object.fromEntries(
      [
        'FadeIn',
        'FadeInUp',
        'FadeInDown',
        'FadeOut',
        'FadeOutUp',
        'FadeOutDown',
        'SlideInDown',
      ].map(name => {
        const builder: Record<string, unknown> = {};
        for (const method of [
          'duration',
          'delay',
          'easing',
          'springify',
          'damping',
          'stiffness',
          'mass',
          'build',
        ]) {
          builder[method] = () => builder;
        }
        return [name, builder];
      }),
    ),
  };
});

jest.mock('react-native-webview', () => {
  const MockWebView = jest.requireActual('react-native').View;

  return {
    __esModule: true,
    WebView: MockWebView,
    default: MockWebView,
  };
});

jest.doMock('react-native', () => {
  const React = require('react');
  const createHostComponent = (hostName: string) =>
    React.forwardRef(
      (
        {
          children,
          ...props
        }: {
          children?: React.ReactNode;
        },
        ref: React.Ref<unknown>,
      ) =>
        React.createElement(
          hostName,
          ref == null ? props : { ...props, ref },
          children,
        ),
    );
  const MockNativeView = createHostComponent('View');
  const MockNativeText = createHostComponent('Text');
  const MockNativeTextInput = createHostComponent('TextInput');

  return Object.setPrototypeOf(
    {
      FlatList: MockNativeView,
      Share: {
        share: jest.fn(),
      },
      ScrollView: MockNativeView,
      Text: MockNativeText,
      TextInput: MockNativeTextInput,
      Image: {
        resolveAssetSource: jest.fn(_source => mockFile),
        getSize: jest.fn(
          (
            _uri: string,
            success: (width: number, height: number) => void,
            _failure?: (_error: any) => void,
          ) => success(100, 100),
        ),
      },
    },
    ReactNative,
  );
});

jest.mock('@shopify/flash-list', () => {
  const React = require('react');

  const FlashList = React.forwardRef(
    (
      {
        data = [],
        renderItem,
        ListHeaderComponent,
        ListEmptyComponent,
        ...props
      }: {
        data?: unknown[];
        renderItem?: (args: {
          item: unknown;
          index: number;
        }) => React.ReactNode;
        ListHeaderComponent?: React.ComponentType | React.ReactNode;
        ListEmptyComponent?: React.ComponentType | React.ReactNode;
      },
      ref: React.Ref<unknown>,
    ) =>
      React.createElement(
        'View',
        { ...props, ref },
        typeof ListHeaderComponent === 'function'
          ? React.createElement(ListHeaderComponent)
          : ListHeaderComponent,
        data.length > 0
          ? data.map((item, index) =>
              React.createElement(
                React.Fragment,
                { key: String(index) },
                renderItem?.({ item, index }),
              ),
            )
          : typeof ListEmptyComponent === 'function'
            ? React.createElement(ListEmptyComponent)
            : ListEmptyComponent,
      ),
  );

  return {
    __esModule: true,
    FlashList,
    MasonryFlashList: FlashList,
    useMappingHelper: () => ({
      getMappingKey: (key: string, index: number) => `${key}-${index}`,
    }),
  };
});

jest.mock('react-native-screens', () => {
  const React = require('react');

  const ScreenComponent = ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
  }) => React.createElement('View', props, children);

  return {
    __esModule: true,
    enableFreeze: jest.fn(),
    enableScreens: jest.fn(),
    Screen: ScreenComponent,
    ScreenContainer: ScreenComponent,
    ScreenStack: ScreenComponent,
    ScreenStackItem: ScreenComponent,
  };
});

jest.mock('expo-router', () => ({
  __esModule: true,
  router: {
    back: jest.fn(),
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn(),
  },
  Stack: {
    Screen: () => null,
    // Stack.SearchBar renders into the native navigation header; surface it
    // as a plain TextInput so tests can type into it.
    SearchBar: require('react').forwardRef(
      (
        props: {
          placeholder?: string;
          onChangeText?: (e: unknown) => void;
        },
        ref: unknown,
      ) =>
        require('react').createElement(require('react-native').TextInput, {
          ref,
          testID: 'search-input',
          placeholder: props.placeholder,
          onChangeText: (text: string) =>
            props.onChangeText?.({ nativeEvent: { text } }),
        }),
    ),
  },
  useFocusEffect: jest.fn((effect: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(effect, [effect]);
  }),
  useLocalSearchParams: jest.fn(() => ({})),
  useNavigation: jest.fn(() => ({
    addListener: jest.fn(() => jest.fn()),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  })),
  useScrollToTop: jest.fn(),
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({
    back: jest.fn(),
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn(),
  })),
}));

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mocks are in __mocks__ directory - Jest will auto-discover them
jest.mock('react-native-nitro-modules');
jest.mock('react-native-keyboard-controller');
jest.mock('expo-updates');

// expo/fetch needs manual mock due to path structure
jest.mock('expo/fetch');

jest.mock('pressto');

jest.mock('@app/components/BottomSheet/BottomSheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BottomSheet: ({
      children,
      isPresented,
      testID,
    }: {
      children?: ReactNode;
      isPresented: boolean;
      testID?: string;
    }) =>
      isPresented ? React.createElement(View, { testID }, children) : null,
  };
});

jest.mock('@expo/ui/community/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BottomSheet: ({
      children,
      index,
    }: {
      children?: ReactNode;
      index?: number;
    }) =>
      index === undefined || index >= 0
        ? React.createElement(View, null, children)
        : null,
  };
});

jest.mock('@app/components/BottomSheet/BottomSheetProvider', () => ({
  AppBottomSheetProvider: ({ children }: { children?: ReactNode }) => children,
}));

jest.mock('@app/utils/device/deviceTier', () => ({
  getDeviceTier: () => 'high',
  isLowEndDevice: () => false,
  getTotalDeviceMemoryBytes: () => 8 * 1024 * 1024 * 1024,
}));

jest.mock('sonner-native', () => ({
  Toaster: () => null,
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('react-native-ease', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    EaseView: ({
      children,
      style,
      ...rest
    }: {
      children?: React.ReactNode;
      style?: unknown;
    }) => React.createElement(View, { ...rest, style }, children),
  };
});
