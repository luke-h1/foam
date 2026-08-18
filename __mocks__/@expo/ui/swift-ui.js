const { useRef, createElement } = require('react');
const { Text, View } = require('react-native');

const swiftUi = jest.requireActual('@expo/ui/swift-ui');

module.exports = {
  ...swiftUi,
  useNativeState: initial => useRef({ value: initial }).current,
  ContentUnavailableView: ({ title, description }) =>
    createElement(
      View,
      null,
      title == null ? null : createElement(Text, null, title),
      description == null ? null : createElement(Text, null, description),
    ),
};
