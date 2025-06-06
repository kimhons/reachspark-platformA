/**
 * Jest setup file
 */
require('@testing-library/jest-dom');

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => {
  const firebaseMock = {
    apps: [],
    initializeApp: jest.fn(() => {
      firebaseMock.apps.push({});
      return {};
    }),
    firestore: jest.fn(() => ({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({
            exists: true,
            data: jest.fn(() => ({}))
          })),
          set: jest.fn(() => Promise.resolve()),
          update: jest.fn(() => Promise.resolve())
        })),
        add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
        where: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            limit: jest.fn(() => ({
              get: jest.fn(() => Promise.resolve({
                forEach: jest.fn(),
                docs: []
              }))
            }))
          }))
        }))
      })),
      FieldValue: {
        serverTimestamp: jest.fn(() => new Date().toISOString()),
        arrayUnion: jest.fn((...args) => args),
        arrayRemove: jest.fn((...args) => args),
        increment: jest.fn(n => n)
      }
    }))
  };
  return firebaseMock;
});

// Mock Firebase Functions
jest.mock('firebase-functions', () => ({
  config: jest.fn(() => ({})),
  https: {
    onCall: jest.fn(handler => handler),
    onRequest: jest.fn(handler => handler)
  },
  firestore: {
    document: jest.fn(() => ({
      onCreate: jest.fn(handler => handler),
      onUpdate: jest.fn(handler => handler),
      onDelete: jest.fn(handler => handler),
      onWrite: jest.fn(handler => handler)
    }))
  },
  auth: {
    user: jest.fn(() => ({
      onCreate: jest.fn(handler => handler),
      onDelete: jest.fn(handler => handler)
    }))
  },
  pubsub: {
    schedule: jest.fn(() => ({
      onRun: jest.fn(handler => handler)
    }))
  },
  logger: {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Global test timeout
jest.setTimeout(10000);

// Global console mocks to prevent noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK'
  })
);
