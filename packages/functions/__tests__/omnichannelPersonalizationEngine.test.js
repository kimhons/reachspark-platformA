/**
 * Unit tests for Omnichannel Personalization Engine
 */
const { 
  CHANNEL_TYPES, 
  PERSONALIZATION_TYPES, 
  updateCustomerProfile,
  generatePersonalizedContent,
  trackPersonalizationInteraction
} = require('../src/features/omnichannelPersonalizationEngine');
const admin = require('firebase-admin');
const { retryWithBackoff, ErrorTypes } = require('../src/utils');

// Mock the retryWithBackoff utility
jest.mock('../src/utils', () => ({
  ...jest.requireActual('../src/utils'),
  retryWithBackoff: jest.fn((fn) => fn()),
  logError: jest.fn()
}));

describe('Omnichannel Personalization Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateCustomerProfile', () => {
    test('should create new profile when it does not exist', async () => {
      // Mock Firestore get and set
      const getMock = jest.fn().mockResolvedValue({ exists: false });
      const setMock = jest.fn().mockResolvedValue(true);
      const docMock = jest.fn().mockReturnValue({ get: getMock, set: setMock });
      const collectionMock = jest.fn().mockReturnValue({ doc: docMock });
      
      admin.firestore().collection = collectionMock;
      
      const customerId = 'test-customer-123';
      const profileData = { name: 'Test Customer', email: 'test@example.com' };
      
      const result = await updateCustomerProfile(customerId, profileData);
      
      expect(collectionMock).toHaveBeenCalledWith('customerProfiles');
      expect(docMock).toHaveBeenCalledWith(customerId);
      expect(getMock).toHaveBeenCalled();
      expect(setMock).toHaveBeenCalled();
      expect(result.isNewProfile).toBe(true);
      expect(result.customerId).toBe(customerId);
      expect(result.name).toBe(profileData.name);
    });
    
    test('should update existing profile', async () => {
      // Mock existing profile
      const existingProfile = {
        customerId: 'test-customer-123',
        name: 'Old Name',
        email: 'old@example.com',
        createdAt: '2023-01-01'
      };
      
      // Mock Firestore get and update
      const getMock = jest.fn().mockResolvedValue({ 
        exists: true,
        data: () => existingProfile
      });
      const updateMock = jest.fn().mockResolvedValue(true);
      const docMock = jest.fn().mockReturnValue({ get: getMock, update: updateMock });
      const collectionMock = jest.fn().mockReturnValue({ doc: docMock });
      
      admin.firestore().collection = collectionMock;
      
      const customerId = 'test-customer-123';
      const profileData = { name: 'New Name' };
      
      const result = await updateCustomerProfile(customerId, profileData);
      
      expect(collectionMock).toHaveBeenCalledWith('customerProfiles');
      expect(docMock).toHaveBeenCalledWith(customerId);
      expect(getMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
      expect(result.isNewProfile).toBe(false);
      expect(result.name).toBe(profileData.name);
      expect(result.email).toBe(existingProfile.email);
    });
    
    test('should throw error when customerId is missing', async () => {
      await expect(updateCustomerProfile(null, {})).rejects.toThrow('Failed to update customer profile');
    });
  });

  describe('generatePersonalizedContent', () => {
    test('should validate required parameters', async () => {
      await expect(generatePersonalizedContent(null, CHANNEL_TYPES.EMAIL, PERSONALIZATION_TYPES.CONTENT))
        .rejects.toThrow('Failed to generate personalized content');
    });
    
    test('should validate channel type', async () => {
      await expect(generatePersonalizedContent('customer-123', 'invalid-channel', PERSONALIZATION_TYPES.CONTENT))
        .rejects.toThrow('Failed to generate personalized content');
    });
    
    test('should validate personalization type', async () => {
      await expect(generatePersonalizedContent('customer-123', CHANNEL_TYPES.EMAIL, 'invalid-type'))
        .rejects.toThrow('Failed to generate personalized content');
    });
  });

  describe('trackPersonalizationInteraction', () => {
    test('should validate required parameters', async () => {
      await expect(trackPersonalizationInteraction(null, 'result-123', 'click'))
        .rejects.toThrow('Failed to track personalization interaction');
      
      await expect(trackPersonalizationInteraction('customer-123', null, 'click'))
        .rejects.toThrow('Failed to track personalization interaction');
      
      await expect(trackPersonalizationInteraction('customer-123', 'result-123', null))
        .rejects.toThrow('Failed to track personalization interaction');
    });
  });
});
