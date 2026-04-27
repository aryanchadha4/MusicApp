/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock(
  '@react-navigation/native',
  () => ({
    NavigationContainer: ({ children }) => children,
    DefaultTheme: {
      dark: false,
      colors: {
        primary: '#000',
        background: '#fff',
        card: '#fff',
        text: '#000',
        border: '#ccc',
        notification: '#000',
      },
    },
    useFocusEffect: jest.fn(),
    useRoute: jest.fn(() => ({ params: {} })),
    CommonActions: {
      reset: jest.fn(() => ({ type: 'RESET' })),
    },
  }),
  { virtual: true }
);

jest.mock(
  '@react-navigation/native-stack',
  () => ({
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => children,
      Screen: () => null,
    }),
  }),
  { virtual: true }
);

jest.mock(
  '@react-navigation/bottom-tabs',
  () => ({
    createBottomTabNavigator: () => ({
      Navigator: ({ children }) => children,
      Screen: () => null,
    }),
  }),
  { virtual: true }
);

jest.mock(
  'react-native-safe-area-context',
  () => ({
    SafeAreaProvider: ({ children }) => children,
  }),
  { virtual: true }
);

jest.mock(
  '@react-native-async-storage/async-storage',
  () => ({
    getItem: jest.fn(() => Promise.resolve('')),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  }),
  { virtual: true }
);

import App from '../App';

test('renders correctly', async () => {
  let renderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    renderer.unmount();
  });
});
