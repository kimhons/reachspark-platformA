import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const SemanticContentIntelligence = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  const [selectedContent, setSelectedContent] = useState(null);

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
    { id: 'analysis', label: 'Content Analysis' },
    { id: 'patterns', label: 'Performance Patterns' },
    { id: 'generator', label: 'Content Generator' },
    { id: 'calendar', label: 'Content Calendar' }
  ];

  const contentItems = [
    {
      id: 1,
      title: '10 Ways AI is Transforming Marketing in 2025',
      type: 'Blog Post',
      channel: 'Website',
      date: '2025-04-15',
      performance: 'High',
      engagement: '4.8%',
      views: '12,450',
      shares: '843',
      conversions: '38'
    },
    {
      id: 2,
      title: 'Introducing Our New Product Line',
      type: 'Email',
      channel: 'Email Marketing',
      date: '2025-04-10',
      performance: 'Medium',
      engagement: '3.2%',
      views: '8,750',
      shares: '124',
      conversions: '52'
    },
    {
      id: 3,
      title: 'Summer Sale - 30% Off Everything',
      type: 'Social Post',
      channel: 'Instagram',
      date: '2025-04-05',
      performance: 'Very High',
      engagement: '5.7%',
      views: '24,680',
      shares: '1,245',
      conversions: '87'
    },
    {
      id: 4,
      title: 'How to Optimize Your Marketing Strategy',
      type: 'Webinar',
      channel: 'YouTube',
      date: '2025-03-28',
      performance: 'Medium',
      engagement: '3.5%',
      views: '5,320',
      shares: '267',
      conversions: '29'
    },
    {
      id: 5,
      title: 'Customer Success Story: Global Enterprises',
      type: 'Case Study',
      channel: 'Website',
      date: '2025-03-20',
      performance: 'High',
      engagement: '4.2%',
      views: '3,870',
      shares: '192',
      conversions: '45'
    }
  ];

  const patterns = [
    {
      id: 1,
      name: 'List-Based Headlines',
      description: 'Headlines with numbers (e.g., "10 Ways to...") perform 37% better than question-based headlines.',
      confidence: 'High',
      impact: 'Medium',
      examples: ['10 Ways AI is Transforming Marketing in 2025', '5 Strategies for Better Conversion Rates']
    },
    {
      id: 2,
      name: 'Social Proof Elements',
      description: 'Content featuring customer testimonials or case studies has 58% higher engagement.',
      confidence: 'Very High',
      impact: 'High',
      examples: ['Customer Success Story: Global Enterprises', 'How Company X Increased Sales by 200%']
    },
    {
      id: 3,
      name: 'Actionable Advice',
      description: 'Content with specific, actionable steps has 42% higher time-on-page metrics.',
      confidence: 'Medium',
      impact: 'High',
      examples: ['How to Optimize Your Marketing Strategy', 'A Step-by-Step Guide to Email Campaigns']
    },
    {
      id: 4,
      name: 'Emotional Triggers',
      description: 'Content evoking positive emotions (excitement, curiosity) has 29% higher share rates.',
      confidence: 'High',
      impact: 'Medium',
      examples: ['Exciting New Features Coming This Summer', 'The Surprising Truth About Customer Retention']
    }
  ];

  const getPerformanceColor = (performance) => {
    const performanceColors = {
      'Very High': 'bg-green-100 text-green-800',
      'High': 'bg-blue-100 text-blue-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-red-100 text-red-800'
    };
    return performanceColors[performance] || 'bg-gray-100 text-gray-800';
  };

  const getConfidenceColor = (confidence) => {
    const confidenceColors = {
      'Very High': 'text-green-600',
      'High': 'text-blue-600',
      'Medium': 'text-yellow-600',
      'Low': 'text-red-600'
    };
    return confidenceColors[confidence] || 'text-gray-600';
  };

  const getImpactColor = (impact) => {
    const impactColors = {
      'Very High': 'text-purple-600',
      'High': 'text-indigo-600',
      'Medium': 'text-blue-600',
      'Low': 'text-gray-600'
    };
    return impactColors[impact] || 'text-gray-600';
  };

  const handleContentClick = (content) => {
    setSelectedContent(content);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-700 px-6 py-4">
        <h3 className="text-xl font-bold text-white">Semantic Content Intelligence</h3>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-yellow-500 text-yellow-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'analysis' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Content Performance Analysis</h4>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-yellow-500 focus:border-yellow-500">
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                </select>
                <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Analyze New Content
                </button>
              </div>
            </div>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg mb-6">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Content Title</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Channel</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Performance</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {contentItems.map((content) => (
                    <tr 
                      key={content.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedContent?.id === content.id ? 'bg-yellow-50' : ''}`}
                      onClick={() => handleContentClick(content)}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{content.title}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{content.type}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{content.channel}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{content.date}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(content.performance)}`}>
                          {content.performance}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <button className="text-yellow-600 hover:text-yellow-900">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {selectedContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-bold text-gray-900">{selectedContent.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(selectedContent.performance)}`}>
                    {selectedContent.performance} Performance
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Engagement Rate</p>
                    <p className="text-xl font-bold text-gray-900">{selectedContent.engagement}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Views</p>
                    <p className="text-xl font-bold text-gray-900">{selectedContent.views}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Shares</p>
                    <p className="text-xl font-bold text-gray-900">{selectedContent.shares}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Conversions</p>
                    <p className="text-xl font-bold text-gray-900">{selectedContent.conversions}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Semantic Analysis</h5>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Informative</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Educational</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Actionable</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Engaging</span>
                    </div>
                    <p className="text-sm text-gray-600">This content performs well due to its informative nature and actionable advice. The use of specific examples and data points increases credibility and engagement. The content structure with clear sections and subheadings improves readability.</p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button className="bg-white border border-yellow-500 text-yellow-500 hover:bg-yellow-50 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                    Generate Variations
                  </button>
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                    Apply Insights
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'patterns' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">High-Performing Content Patterns</h4>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                Refresh Analysis
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {patterns.map(pattern => (
                <div key={pattern.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="text-lg font-bold text-gray-900">{pattern.name}</h5>
                    <div className="flex space-x-2">
                      <span className={`text-sm font-medium ${getConfidenceColor(pattern.confidence)}`}>
                        {pattern.confidence} Confidence
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className={`text-sm font-medium ${getImpactColor(pattern.impact)}`}>
                        {pattern.impact} Impact
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{pattern.description}</p>
                  
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-2">Examples in Your Content:</h6>
                    <ul className="space-y-1">
                      {pattern.examples.map((example, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <svg className="w-4 h-4 text-yellow-500 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                          </svg>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button className="text-yellow-600 hover:text-yellow-700 text-sm font-medium transition-colors flex items-center">
                      Apply to New Content
                      <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-5">
              <h5 className="text-lg font-bold text-gray-900 mb-3">AI-Generated Content Recommendations</h5>
              <p className="text-gray-600 mb-4">Based on your high-performing content patterns, we recommend the following content strategies:</p>
              
              <ul className="space-y-3 mb-4">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Create more list-based content with specific numbers</p>
                    <p className="text-sm text-gray-600">Example: "7 Proven Strategies to Increase Your Conversion Rate in 2025"</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Incorporate more customer success stories and testimonials</p>
                    <p className="text-sm text-gray-600">Example: "How Company X Achieved 300% ROI with Our Solution"</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Focus on actionable, step-by-step content</p>
                    <p className="text-sm text-gray-600">Example: "The Complete Guide to Setting Up Your Marketing Automation in 5 Steps"</p>
                  </div>
                </li>
              </ul>
              
              <div className="flex justify-end">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Generate Content Ideas
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'generator' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">AI-Powered Content Generator</h4>
              <p className="text-gray-600 mb-6">Create optimized content based on your high-performing patterns and audience preferences.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500">
                    <option>Blog Post</option>
                    <option>Social Media Post</option>
                    <option>Email Newsletter</option>
                    <option>Landing Page</option>
                    <option>Product Description</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Enter your content topic"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500">
                    <option>Marketing Professionals</option>
                    <option>Small Business Owners</option>
                    <option>E-commerce Managers</option>
                    <option>Digital Marketers</option>
                    <option>C-Level Executives</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Patterns to Apply</label>
                  <div className="space-y-2">
                    {patterns.map(pattern => (
                      <div key={pattern.id} className="flex items-center">
                        <input
                          id={`pattern-${pattern.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`pattern-${pattern.id}`} className="ml-2 text-sm text-gray-700">
                          {pattern.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Instructions (Optional)</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                    rows="3"
                    placeholder="Any specific requirements or preferences for this content"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-6 rounded-lg font-medium transition-colors">
                    Generate Content
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h5 className="text-lg font-medium text-gray-900 mb-4">Recently Generated Content</h5>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h6 className="font-medium text-gray-900">7 Proven Strategies to Boost Your Social Media Engagement</h6>
                    <span className="text-xs text-gray-500">Generated 2 hours ago</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    In today's competitive digital landscape, standing out on social media requires more than just regular posting. This article explores seven data-backed strategies that can significantly increase your engagement metrics and build a more loyal audience...
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Edit</button>
                    <button className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">View Full</button>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h6 className="font-medium text-gray-900">How Our Enterprise Solution Helped Company X Increase Revenue by 200%</h6>
                    <span className="text-xs text-gray-500">Generated 1 day ago</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    When global enterprise Company X approached us with their marketing challenges, they were struggling with fragmented customer data and inefficient campaign management. This case study details how our integrated solution transformed their approach...
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Edit</button>
                    <button className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">View Full</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'calendar' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">AI-Optimized Content Calendar</h4>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-yellow-500 focus:border-yellow-500">
                  <option>May 2025</option>
                  <option>June 2025</option>
                  <option>July 2025</option>
                  <option>August 2025</option>
                </select>
                <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Generate Calendar
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                <div className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-700">Sun</div>
                <div className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-700">Mon</div>
                <div className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-700">Tue</div>
                <div className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-700">Wed</div>
                <div className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-700">Thu</div>
                <div className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-700">Fri</div>
                <div className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-700">Sat</div>
              </div>
              
              <div className="grid grid-cols-7 grid-rows-5 gap-px bg-gray-200">
                {/* Week 1 */}
                <div className="bg-gray-50 p-2 h-32">
                  <div className="text-sm text-gray-400">28</div>
                </div>
                <div className="bg-gray-50 p-2 h-32">
                  <div className="text-sm text-gray-400">29</div>
                </div>
                <div className="bg-gray-50 p-2 h-32">
                  <div className="text-sm text-gray-400">30</div>
                </div>
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">1</div>
                  <div className="mt-1 p-1 text-xs bg-blue-100 text-blue-800 rounded">
                    Blog Post: 10 Ways AI is Transforming Marketing
                  </div>
                </div>
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">2</div>
                </div>
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">3</div>
                  <div className="mt-1 p-1 text-xs bg-green-100 text-green-800 rounded">
                    Social: Product Feature Highlight
                  </div>
                </div>
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">4</div>
                </div>
                
                {/* Week 2 */}
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">5</div>
                </div>
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">6</div>
                  <div className="mt-1 p-1 text-xs bg-purple-100 text-purple-800 rounded">
                    Email: Weekly Newsletter
                  </div>
                </div>
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">7</div>
                </div>
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">8</div>
                  <div className="mt-1 p-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Webinar: Marketing Strategy Optimization
                  </div>
                </div>
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">9</div>
                </div>
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">10</div>
                  <div className="mt-1 p-1 text-xs bg-green-100 text-green-800 rounded">
                    Social: Customer Success Story
                  </div>
                </div>
                <div className="bg-white p-2 h-32">
                  <div className="text-sm font-medium text-gray-900">11</div>
                </div>
                
                {/* Additional weeks would follow the same pattern */}
                {/* For brevity, only showing 2 weeks */}
              </div>
            </div>
            
            <div className="mt-6 bg-yellow-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">AI-Generated Content Mix Recommendations</h5>
              <p className="text-sm text-gray-600 mb-3">Based on your audience engagement patterns and content performance, we recommend the following content mix for optimal results:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <h6 className="text-sm font-medium text-gray-900 mb-2">Content Types</h6>
                  <div className="h-32 flex items-end space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 bg-blue-500 rounded-t-lg" style={{ height: '70%' }}></div>
                      <p className="mt-1 text-xs text-gray-600">Blog</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 bg-green-500 rounded-t-lg" style={{ height: '90%' }}></div>
                      <p className="mt-1 text-xs text-gray-600">Social</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 bg-purple-500 rounded-t-lg" style={{ height: '50%' }}></div>
                      <p className="mt-1 text-xs text-gray-600">Email</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 bg-yellow-500 rounded-t-lg" style={{ height: '30%' }}></div>
                      <p className="mt-1 text-xs text-gray-600">Webinar</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 bg-red-500 rounded-t-lg" style={{ height: '40%' }}></div>
                      <p className="mt-1 text-xs text-gray-600">Video</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg">
                  <h6 className="text-sm font-medium text-gray-900 mb-2">Posting Frequency</h6>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Blog Posts</span>
                        <span className="text-xs font-medium text-gray-900">2 per week</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Social Media</span>
                        <span className="text-xs font-medium text-gray-900">5 per week</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Email Newsletters</span>
                        <span className="text-xs font-medium text-gray-900">1 per week</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Webinars/Videos</span>
                        <span className="text-xs font-medium text-gray-900">2 per month</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SemanticContentIntelligence;
