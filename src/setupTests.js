// Jest setup file
import '@testing-library/jest-dom';
import { jest, beforeAll, afterAll } from '@jest/globals';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = function TextEncoder() {};
  globalThis.TextEncoder.prototype.encode = function encode() { return []; };
}

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = function TextDecoder() {};
  globalThis.TextDecoder.prototype.decode = function decode() { return ''; };
}

// Mock the matchMedia function for components that use it
globalThis.matchMedia = globalThis.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock the window.scrollTo method
globalThis.scrollTo = jest.fn();

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      /Warning.*not wrapped in act/.test(args[0]) ||
      /Warning: ReactDOM.render is no longer supported/.test(args[0])
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
}); 