import '@testing-library/jest-native/extend-expect';
import { jest } from '@jest/globals';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
      dispatch: jest.fn(),
      getState: jest.fn(() => ({
        routes: [{ name: 'Home' }],
        index: 0,
      })),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock Expo Font
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]),
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Firebase
jest.mock('./src/config/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
}));

// Global error handler mock
global.ErrorUtils = {
  setGlobalHandler: jest.fn(),
  getGlobalHandler: jest.fn(() => jest.fn()),
};

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

