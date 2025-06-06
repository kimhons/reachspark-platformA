import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../hooks/useTokens';

/**
 * Component for generating marketing content using AI APIs (OpenAI or Gemini)
 */
const ContentGenerator = () => {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('social');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState(200);
  const [model, setModel] = useState('openai'); // Default to OpenAI
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');
  const [tokenCost, setTokenCost] = useState(10);
  const { user } = useAuth();
  const { tokens, deductTokens } = useTokens();
  
  // Calculate token cost based on content length and model
  useEffect(() => {
    let cost = 10; // Base cost
    
    if (length > 300) cost = 15;
    if (length > 500) cost = 20;
    if (length > 1000) cost = 30;
    
    if (contentType === 'blog') cost += 10; // Blog posts cost more
    
    // Gemini is slightly cheaper
    if (model === 'gemini') {
      cost = Math.max(8, cost - 2);
    }
    
    setTokenCost(cost);
  }, [length, contentType, model]);
  
  const handleGenerate = async () => {
    if (!topic) {
      setError('Please enter a topic for your content');
      return;
    }
    
    if (tokens < tokenCost) {
      setError('Not enough tokens. Please purchase more tokens to continue.');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError('');
      
      // Call Firebase function to generate content
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: contentType,
          topic,
          tone,
          length,
          model // Pass the selected model
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate content');
      }
      
      const data = await response.json();
      setGeneratedContent(data.text);
      
      // Save to Firestore
      const db = getFirestore();
      await addDoc(collection(db, 'content'), {
        userId: user.uid,
        type: contentType,
        topic,
        tone,
        length,
        model, // Save which model was used
        content: data.text,
        createdAt: new Date()
      });
      
      // Deduct tokens
      await deductTokens(tokenCost, `Content Generation (${model.toUpperCase()})`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">AI Content Generator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Topic
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter your content topic..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content Type
          </label>
          <select
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          >
            <option value="social">Social Media Post</option>
            <option value="email">Email</option>
            <option value="blog">Blog Post</option>
            <option value="ad">Advertisement</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tone
          </label>
          <select
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="casual">Casual</option>
            <option value="enthusiastic">Enthusiastic</option>
            <option value="authoritative">Authoritative</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Length (words)
          </label>
          <input
            type="range"
            min="100"
            max="1500"
            step="100"
            className="w-full"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>100</span>
            <span>{length}</span>
            <span>1500</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI Model
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="model"
                value="openai"
                checked={model === 'openai'}
                onChange={() => setModel('openai')}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">OpenAI</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="model"
                value="gemini"
                checked={model === 'gemini'}
                onChange={() => setModel('gemini')}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Gemini</span>
            </label>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {model === 'openai' ? 
              "OpenAI provides highly creative and nuanced content" : 
              "Gemini offers excellent results at a slightly lower token cost"}
          </div>
        </div>
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
      
      {generatedContent && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Generated Content
          </label>
          <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="prose dark:prose-invert max-w-none">
              {generatedContent.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200"
              onClick={() => navigator.clipboard.writeText(generatedContent)}
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center"
        onClick={handleGenerate}
        disabled={isGenerating || !topic}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Content...
          </>
        ) : (
          'Generate Content'
        )}
      </motion.button>
    </div>
  );
};

export default ContentGenerator;
