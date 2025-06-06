/**
 * Unit tests for errorHandling utility
 */
const { ErrorTypes, ReachSparkError, logError } = require('../src/utils/errorHandling');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

describe('Error Handling Utilities', () => {
  describe('ReachSparkError', () => {
    test('should create error with correct properties', () => {
      const originalError = new Error('Original error');
      const context = { userId: '123', operation: 'test' };
      const error = new ReachSparkError('Test error', ErrorTypes.VALIDATION_ERROR, originalError, context);
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ReachSparkError');
      expect(error.type).toBe(ErrorTypes.VALIDATION_ERROR);
      expect(error.originalError).toBe(originalError);
      expect(error.context).toEqual(context);
      expect(error.timestamp).toBeDefined();
    });
  });
  
  describe('logError', () => {
    test('should log error to Firestore and console', async () => {
      const addMock = jest.fn().mockResolvedValue({ id: 'mock-log-id' });
      const collectionMock = jest.fn().mockReturnValue({ add: addMock });
      
      // Mock Firestore
      admin.firestore().collection = collectionMock;
      
      const error = new ReachSparkError('Test error', ErrorTypes.DATABASE_ERROR);
      await logError(error, 'testFunction', { userId: '123' });
      
      // Verify Firestore logging
      expect(collectionMock).toHaveBeenCalledWith('errorLogs');
      expect(addMock).toHaveBeenCalled();
      
      // Verify console logging
      expect(functions.logger.error).toHaveBeenCalled();
    });
    
    test('should handle Firestore logging failure', async () => {
      const addMock = jest.fn().mockRejectedValue(new Error('Firestore error'));
      const collectionMock = jest.fn().mockReturnValue({ add: addMock });
      
      // Mock Firestore
      admin.firestore().collection = collectionMock;
      
      const error = new Error('Test error');
      await logError(error, 'testFunction');
      
      // Verify console logging of both errors
      expect(functions.logger.error).toHaveBeenCalledTimes(2);
    });
  });
});
