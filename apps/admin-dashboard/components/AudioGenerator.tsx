import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../hooks/useTokens';

/**
 * Component for generating audio from text using ElevenLabs API
 */
const AudioGenerator = () => {
  const [text, setText] = useState('');
  const [voiceType, setVoiceType] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [tokenCost, setTokenCost] = useState(5);
  const { user } = useAuth();
  const { tokens, deductTokens } = useTokens();
  
  // Calculate token cost based on text length
  useEffect(() => {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    let cost = 5; // Base cost
    
    if (wordCount > 100) cost = 10;
    if (wordCount > 300) cost = 15;
    if (wordCount > 500) cost = 20;
    
    setTokenCost(cost);
  }, [text]);
  
  const handleGenerate = async () => {
    if (!text) {
      setError('Please enter some text to convert to speech');
      return;
    }
    
    if (tokens < tokenCost) {
      setError('Not enough tokens. Please purchase more tokens to continue.');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError('');
      
      // Call Firebase function to generate audio
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
          voice_type: voiceType
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
      
      // Save to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `audio/${user.uid}/${Date.now()}.mp3`);
      await uploadBytes(storageRef, audioBlob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Save metadata to Firestore
      const db = getFirestore();
      await addDoc(collection(db, 'audio'), {
        userId: user.uid,
        text,
        voiceType,
        createdAt: new Date(),
        url: downloadUrl
      });
      
      // Deduct tokens
      await deductTokens(tokenCost, 'Audio Generation');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">AI Voice Generator</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Text to Convert
        </label>
        <textarea
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          rows="6"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text you want to convert to speech..."
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Voice Type
        </label>
        <select
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          value={voiceType}
          onChange={(e) => setVoiceType(e.target.value)}
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="authoritative">Authoritative</option>
        </select>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Token Cost: <span className="font-bold">{tokenCost}</span> tokens
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Available Tokens: <span className="font-bold">{tokens}</span>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {audioUrl && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Generated Audio
          </label>
          <audio controls className="w-full">
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center"
        onClick={handleGenerate}
        disabled={isGenerating || !text}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Audio...
          </>
        ) : (
          'Generate Audio'
        )}
      </motion.button>
    </div>
  );
};

export default AudioGenerator;
