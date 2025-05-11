// jest.setup.js
import "@testing-library/jest-dom";

// Polyfill for TextEncoder and TextDecoder
import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

