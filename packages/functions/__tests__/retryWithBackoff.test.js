/**
 * Unit tests for retryWithBackoff utility
 */
const retryWithBackoff = require('../src/utils/retryWithBackoff');

describe('retryWithBackoff', () => {
  // Mock console.log to prevent noise in test output
  const originalConsoleLog = console.log;
  beforeEach(() => {
    console.log = jest.fn();
  });
  afterEach(() => {
    console.log = originalConsoleLog;
  });

  test('should resolve on successful execution', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(mockFn);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should retry on failure and eventually succeed', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValue('success after retry');
    
    const result = await retryWithBackoff(mockFn, 3, 10); // Use small delay for tests
    
    expect(result).toBe('success after retry');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('should throw after max retries', async () => {
    const mockError = new Error('Persistent error');
    const mockFn = jest.fn().mockRejectedValue(mockError);
    
    await expect(retryWithBackoff(mockFn, 2, 10)).rejects.toThrow('Persistent error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('should respect shouldRetry function', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockRejectedValueOnce(new Error('Fatal error'))
      .mockResolvedValue('should not reach here');
    
    const shouldRetry = (error) => error.message !== 'Fatal error';
    
    await expect(retryWithBackoff(mockFn, 3, 10, shouldRetry)).rejects.toThrow('Fatal error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
