// Test setup file for Jest
import '@nestjs/testing';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress specific log levels during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  createMockApi: () => ({
    isConnected: true,
    on: jest.fn(),
    rpc: {
      chain: {
        getHeader: jest.fn(),
        getBlockHash: jest.fn(),
        getBlock: jest.fn(),
      },
      system: {
        chain: jest.fn(),
        name: jest.fn(),
        version: jest.fn(),
        properties: jest.fn(),
      },
    },
    query: {
      system: {
        events: {
          at: jest.fn(),
        },
      },
    },
    disconnect: jest.fn(),
  }),
  
  createMockExtrinsic: (section: string, method: string, signer: string, args: any[] = []) => ({
    isSigned: true,
    signer: { toString: () => signer },
    method: {
      section,
      method,
      args: args.map(arg => ({ toHuman: () => arg })),
    },
    hash: { toHex: () => `0x${Math.random().toString(16).substr(2, 8)}` },
  }),
  
  createMockEvent: (section: string, method: string, data: any[], extrinsicIndex?: number) => ({
    event: {
      section,
      method,
      data: data.map(d => ({ toHuman: () => d })),
    },
    phase: extrinsicIndex !== undefined 
      ? { isApplyExtrinsic: true, asApplyExtrinsic: { toNumber: () => extrinsicIndex } }
      : { isApplyExtrinsic: false },
  }),
};

// Type declarations for global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createMockApi: () => any;
        createMockExtrinsic: (section: string, method: string, signer: string, args?: any[]) => any;
        createMockEvent: (section: string, method: string, data: any[], extrinsicIndex?: number) => any;
      };
    }
  }
}
