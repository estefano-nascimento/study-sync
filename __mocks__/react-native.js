// Lightweight mock of react-native that avoids requiring the full native module tree.
// Only the APIs actually used by lib/ and store/ are mocked here.

const Platform = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
  Version: 0,
};

const Alert = {
  alert: jest.fn(),
};

const Appearance = {
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
};

const StyleSheet = {
  create: (styles) => styles,
  flatten: jest.fn((style) => style),
  hairlineWidth: 1,
};

module.exports = {
  Platform,
  Alert,
  Appearance,
  StyleSheet,
};
