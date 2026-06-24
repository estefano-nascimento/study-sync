// Test lib/supabase.ts initialization
const mockCreateClient = jest.fn().mockReturnValue({
  auth: {},
  from: jest.fn(),
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(storage[key] || null)),
    setItem: jest.fn((key: string, val: string) => {
      storage[key] = val;
      return Promise.resolve();
    }),
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(storage[key] || null)),
      setItem: jest.fn((key: string, val: string) => {
        storage[key] = val;
        return Promise.resolve();
      }),
    },
  };
});

describe('supabase client', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Re-mock after resetModules
    jest.doMock('@supabase/supabase-js', () => ({
      createClient: mockCreateClient,
    }));
    jest.doMock('react-native-url-polyfill/auto', () => ({}));
    jest.doMock('@react-native-async-storage/async-storage', () => ({
      getItem: jest.fn(),
      setItem: jest.fn(),
      __esModule: true,
      default: { getItem: jest.fn(), setItem: jest.fn() },
    }));
  });

  it('creates client with iOS platform (uses AsyncStorage)', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));

    require('../../lib/supabase');

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    const [url, key, options] = mockCreateClient.mock.calls[0];
    expect(url).toBe('https://jjhocvhjmjwnbiwbtudl.supabase.co');
    expect(typeof key).toBe('string');
    expect(options.auth.autoRefreshToken).toBe(true);
    expect(options.auth.persistSession).toBe(true);
    expect(options.auth.detectSessionInUrl).toBe(false);
    // storage should be AsyncStorage (not undefined)
    expect(options.auth.storage).toBeDefined();
  });

  it('creates client with web platform (no AsyncStorage)', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'web' },
    }));

    require('../../lib/supabase');

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    const [url, key, options] = mockCreateClient.mock.calls[0];
    expect(url).toBe('https://jjhocvhjmjwnbiwbtudl.supabase.co');
    expect(options.auth.storage).toBeUndefined();
    expect(options.auth.detectSessionInUrl).toBe(true);
  });

  it('creates client with Android platform (uses AsyncStorage)', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android' },
    }));

    require('../../lib/supabase');

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    const [, , options] = mockCreateClient.mock.calls[0];
    expect(options.auth.storage).toBeDefined();
    expect(options.auth.detectSessionInUrl).toBe(false);
  });

  it('exports a supabase instance', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));

    const { supabase } = require('../../lib/supabase');
    expect(supabase).toBeDefined();
  });
});
