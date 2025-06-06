/**
 * LLM Provider Smoke Tests
 * 
 * This script performs basic smoke tests for each LLM provider
 * to verify SDK compatibility and proper instantiation.
 * 
 * Uses mock implementations when in testing mode.
 */

const { 
  openai, 
  gemini, 
  anthropic, 
  LLMProvider,
  LLMEngine,
  TESTING_MODE 
} = require('../utils/llm');

// Test environment information
console.log('Node.js version:', process.version);
console.log('Testing LLM provider SDKs...');
console.log('Testing Mode:', TESTING_MODE ? 'ENABLED (using mock implementations)' : 'DISABLED (using real APIs)');

// Simple test prompt
const TEST_PROMPT = 'Respond with a single word: "Success"';

/**
 * Run smoke test for OpenAI
 */
async function testOpenAI() {
  try {
    console.log('\n--- Testing OpenAI SDK ---');
    
    // Get SDK version safely
    let sdkVersion = 'unknown';
    try {
      sdkVersion = require('openai/package.json').version;
    } catch (error) {
      console.log('Could not determine OpenAI SDK version:', error.message);
    }
    console.log('SDK Version:', sdkVersion);
    
    // Test basic completion with v3.3.0 API pattern
    console.log('Testing chat completion...');
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: TEST_PROMPT }
      ],
      temperature: 0.7,
      max_tokens: 50,
    });
    
    console.log('Response:', response.data.choices[0].message.content);
    console.log('✅ OpenAI SDK test passed');
    return true;
  } catch (error) {
    console.error('❌ OpenAI SDK test failed:', error.message);
    return false;
  }
}

/**
 * Run smoke test for Google Gemini
 */
async function testGemini() {
  try {
    console.log('\n--- Testing Google Gemini SDK ---');
    
    // Get SDK version safely
    let sdkVersion = 'unknown';
    try {
      sdkVersion = require('@google/generative-ai/package.json').version;
    } catch (error) {
      console.log('Could not determine Gemini SDK version:', error.message);
    }
    console.log('SDK Version:', sdkVersion);
    
    // Test basic generation
    console.log('Testing content generation...');
    const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: TEST_PROMPT }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 50,
      },
    });
    
    console.log('Response:', result.response.text());
    console.log('✅ Google Gemini SDK test passed');
    return true;
  } catch (error) {
    console.error('❌ Google Gemini SDK test failed:', error.message);
    return false;
  }
}

/**
 * Run smoke test for Anthropic
 */
async function testAnthropic() {
  try {
    console.log('\n--- Testing Anthropic SDK ---');
    
    // Get SDK version safely - skip for Anthropic due to package.json resolution issue
    console.log('SDK Version: (skipping version check)');
    
    // Test basic message creation
    console.log('Testing message creation...');
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: TEST_PROMPT }],
      temperature: 0.7,
      max_tokens: 50,
    });
    
    console.log('Response:', response.content[0].text);
    console.log('✅ Anthropic SDK test passed');
    return true;
  } catch (error) {
    console.error('❌ Anthropic SDK test failed:', error.message);
    return false;
  }
}

/**
 * Run smoke test for LLMEngine with failover
 */
async function testLLMEngine() {
  try {
    console.log('\n--- Testing LLMEngine with Failover ---');
    
    // Create LLM Engine with failover enabled
    const engine = new LLMEngine('smoke-test', LLMProvider.OPENAI, true);
    
    // Test text generation
    console.log('Testing text generation...');
    const response = await engine.generateText(TEST_PROMPT, {
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      maxTokens: 50,
    });
    
    console.log('Response:', response);
    console.log('✅ LLMEngine test passed');
    return true;
  } catch (error) {
    console.error('❌ LLMEngine test failed:', error.message);
    return false;
  }
}

/**
 * Run all smoke tests
 */
async function runAllTests() {
  console.log('Starting LLM provider smoke tests...');
  console.log('=======================================');
  
  // Track test results
  const results = {
    openai: false,
    gemini: false,
    anthropic: false,
    llmEngine: false
  };
  
  // Run individual tests
  results.openai = await testOpenAI();
  results.gemini = await testGemini();
  results.anthropic = await testAnthropic();
  results.llmEngine = await testLLMEngine();
  
  // Print summary
  console.log('\n--- Test Summary ---');
  console.log('OpenAI:', results.openai ? '✅ PASSED' : '❌ FAILED');
  console.log('Google Gemini:', results.gemini ? '✅ PASSED' : '❌ FAILED');
  console.log('Anthropic:', results.anthropic ? '✅ PASSED' : '❌ FAILED');
  console.log('LLMEngine:', results.llmEngine ? '✅ PASSED' : '❌ FAILED');
  
  // Overall result
  const allPassed = Object.values(results).every(result => result);
  console.log('\nOverall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return {
    allPassed,
    results
  };
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(result => {
      if (result.allPassed) {
        console.log('\nLLM provider SDKs are correctly configured and working.');
        process.exit(0);
      } else {
        console.error('\nSome LLM provider tests failed. Please check the logs for details.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error running tests:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
