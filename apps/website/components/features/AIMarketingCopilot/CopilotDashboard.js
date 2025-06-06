import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CopilotDashboard = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [autonomousMode, setAutonomousMode] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const tabs = [
    { id: 'content', label: 'Content Generation' },
    { id: 'suggestions', label: 'Suggestions' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' }
  ];

  const contentTypes = [
    { id: 'social', label: 'Social Media' },
    { id: 'email', label: 'Email' },
    { id: 'blog', label: 'Blog Post' },
    { id: 'ad', label: 'Ad Copy' }
  ];

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'casual', label: 'Casual' },
    { id: 'enthusiastic', label: 'Enthusiastic' },
    { id: 'informative', label: 'Informative' }
  ];

  const suggestions = [
    {
      id: 1,
      title: 'Optimize Email Subject Lines',
      description: 'Your open rates could improve by 23% with more compelling subject lines.',
      impact: 'High',
      effort: 'Low'
    },
    {
      id: 2,
      title: 'Increase Instagram Post Frequency',
      description: 'Data shows your engagement peaks with 4-5 posts per week.',
      impact: 'Medium',
      effort: 'Medium'
    },
    {
      id: 3,
      title: 'Add Video Content to Blog Posts',
      description: 'Posts with video have 2.3x longer time on page.',
      impact: 'High',
      effort: 'Medium'
    }
  ];

  const toggleAutonomousMode = () => {
    setAutonomousMode(!autonomousMode);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">AI Marketing Copilot</h3>
          <div className="flex items-center">
            <span className="text-blue-100 mr-2 text-sm">Autonomous Mode</span>
            <button 
              onClick={toggleAutonomousMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autonomousMode ? 'bg-green-500' : 'bg-gray-400'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autonomousMode ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'content' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {contentTypes.map(type => (
                  <button
                    key={type.id}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-800 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tones.map(tone => (
                  <button
                    key={tone.id}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic or Keywords</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter topic or keywords"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option>Marketing Professionals</option>
                <option>Small Business Owners</option>
                <option>E-commerce Shoppers</option>
                <option>Tech Enthusiasts</option>
              </select>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors">
                Generate Content
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'suggestions' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="space-y-4">
              {suggestions.map(suggestion => (
                <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-medium text-gray-900">{suggestion.title}</h4>
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        suggestion.impact === 'High' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {suggestion.impact} Impact
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        suggestion.effort === 'Low' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {suggestion.effort} Effort
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-600">{suggestion.description}</p>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Dismiss</button>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Apply</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Content Generated</h4>
                <p className="text-2xl font-bold text-gray-900">247</p>
                <p className="text-sm text-green-600 mt-1">↑ 12% from last month</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Avg. Engagement Rate</h4>
                <p className="text-2xl font-bold text-gray-900">3.8%</p>
                <p className="text-sm text-green-600 mt-1">↑ 0.5% from last month</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Time Saved</h4>
                <p className="text-2xl font-bold text-gray-900">37 hours</p>
                <p className="text-sm text-green-600 mt-1">↑ 8 hours from last month</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Content Performance by Type</h4>
              <div className="h-64 flex items-end space-x-6">
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-blue-600 rounded-t-lg" style={{ height: '65%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Social</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-blue-600 rounded-t-lg" style={{ height: '80%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Email</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-blue-600 rounded-t-lg" style={{ height: '45%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Blog</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-blue-600 rounded-t-lg" style={{ height: '70%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Ad Copy</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Autonomous Mode Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 font-medium">Automatic Content Generation</p>
                      <p className="text-sm text-gray-500">Generate content based on your calendar</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-400 transition-colors focus:outline-none">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 font-medium">Proactive Suggestions</p>
                      <p className="text-sm text-gray-500">Receive AI-powered improvement ideas</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500 transition-colors focus:outline-none">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 font-medium">A/B Testing</p>
                      <p className="text-sm text-gray-500">Automatically test content variations</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500 transition-colors focus:outline-none">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Content Preferences</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Tone</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option>Professional</option>
                      <option>Casual</option>
                      <option>Enthusiastic</option>
                      <option>Informative</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Length</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option>Short</option>
                      <option>Medium</option>
                      <option>Long</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Voice Guidelines</label>
                    <textarea 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Enter your brand voice guidelines"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CopilotDashboard;
