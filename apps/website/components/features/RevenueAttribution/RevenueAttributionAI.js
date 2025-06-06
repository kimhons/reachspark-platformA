import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const RevenueAttributionAI = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModel, setSelectedModel] = useState('algorithmic');
  const [selectedChannel, setSelectedChannel] = useState(null);

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
    { id: 'dashboard', label: 'Attribution Dashboard' },
    { id: 'models', label: 'Attribution Models' },
    { id: 'journeys', label: 'Customer Journeys' },
    { id: 'budget', label: 'Budget Optimization' }
  ];

  const attributionModels = [
    { id: 'first-touch', label: 'First Touch', description: 'Attributes 100% of the conversion value to the first touchpoint' },
    { id: 'last-touch', label: 'Last Touch', description: 'Attributes 100% of the conversion value to the last touchpoint' },
    { id: 'linear', label: 'Linear', description: 'Distributes the conversion value equally across all touchpoints' },
    { id: 'time-decay', label: 'Time Decay', description: 'Attributes more value to touchpoints closer to conversion' },
    { id: 'position-based', label: 'Position Based', description: 'Attributes 40% to first and last touchpoints, 20% to middle touchpoints' },
    { id: 'algorithmic', label: 'Algorithmic (AI)', description: 'Uses machine learning to determine the optimal attribution weights' }
  ];

  const channels = [
    { id: 'paid-search', name: 'Paid Search', revenue: '$125,450', roi: '320%', contribution: '28%', color: 'blue' },
    { id: 'organic-search', name: 'Organic Search', revenue: '$98,720', roi: '580%', contribution: '22%', color: 'green' },
    { id: 'social-media', name: 'Social Media', revenue: '$87,350', roi: '210%', contribution: '19%', color: 'purple' },
    { id: 'email', name: 'Email Marketing', revenue: '$65,890', roi: '410%', contribution: '15%', color: 'yellow' },
    { id: 'direct', name: 'Direct Traffic', revenue: '$45,230', roi: '∞', contribution: '10%', color: 'red' },
    { id: 'referral', name: 'Referral', revenue: '$28,760', roi: '290%', contribution: '6%', color: 'indigo' }
  ];

  const journeys = [
    {
      id: 1,
      customer: 'Customer #45291',
      value: '$1,250',
      touchpoints: [
        { channel: 'Paid Search', date: '2025-03-10', interaction: 'Ad Click' },
        { channel: 'Website', date: '2025-03-10', interaction: 'Product Page View' },
        { channel: 'Email', date: '2025-03-15', interaction: 'Promotional Email Open' },
        { channel: 'Social Media', date: '2025-03-18', interaction: 'Retargeting Ad Click' },
        { channel: 'Website', date: '2025-03-18', interaction: 'Add to Cart' },
        { channel: 'Website', date: '2025-03-20', interaction: 'Purchase' }
      ]
    },
    {
      id: 2,
      customer: 'Customer #38756',
      value: '$890',
      touchpoints: [
        { channel: 'Organic Search', date: '2025-03-05', interaction: 'Blog Post View' },
        { channel: 'Email', date: '2025-03-12', interaction: 'Newsletter Click' },
        { channel: 'Website', date: '2025-03-12', interaction: 'Product Page View' },
        { channel: 'Direct', date: '2025-03-17', interaction: 'Return Visit' },
        { channel: 'Website', date: '2025-03-17', interaction: 'Purchase' }
      ]
    },
    {
      id: 3,
      customer: 'Customer #52104',
      value: '$2,340',
      touchpoints: [
        { channel: 'Social Media', date: '2025-02-28', interaction: 'Post Engagement' },
        { channel: 'Website', date: '2025-02-28', interaction: 'Landing Page View' },
        { channel: 'Email', date: '2025-03-05', interaction: 'Abandoned Cart Email' },
        { channel: 'Paid Search', date: '2025-03-10', interaction: 'Branded Search Click' },
        { channel: 'Website', date: '2025-03-10', interaction: 'Add to Cart' },
        { channel: 'Website', date: '2025-03-10', interaction: 'Purchase' }
      ]
    }
  ];

  const budgetRecommendations = [
    {
      id: 1,
      channel: 'Paid Search',
      currentBudget: '$35,000',
      recommendedBudget: '$42,000',
      change: '+20%',
      impact: 'Estimated +$27,500 revenue',
      confidence: 'High'
    },
    {
      id: 2,
      channel: 'Social Media',
      currentBudget: '$28,000',
      recommendedBudget: '$32,200',
      change: '+15%',
      impact: 'Estimated +$18,900 revenue',
      confidence: 'Medium'
    },
    {
      id: 3,
      channel: 'Email Marketing',
      currentBudget: '$12,000',
      recommendedBudget: '$15,600',
      change: '+30%',
      impact: 'Estimated +$22,400 revenue',
      confidence: 'Very High'
    },
    {
      id: 4,
      channel: 'Display Advertising',
      currentBudget: '$18,000',
      recommendedBudget: '$14,400',
      change: '-20%',
      impact: 'Reallocate to higher-performing channels',
      confidence: 'Medium'
    }
  ];

  const handleChannelClick = (channelId) => {
    setSelectedChannel(channelId === selectedChannel ? null : channelId);
  };

  const getChannelColor = (channelId) => {
    const channel = channels.find(c => c.id === channelId);
    return channel ? channel.color : 'gray';
  };

  const getColorClass = (color) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      indigo: 'bg-indigo-500'
    };
    return colorMap[color] || 'bg-gray-500';
  };

  const getColorClassLight = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      indigo: 'bg-indigo-100 text-indigo-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4">
        <h3 className="text-xl font-bold text-white">Revenue Attribution AI</h3>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'dashboard' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Revenue Attribution Overview</h4>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Last Year</option>
                  <option>Custom Range</option>
                </select>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Export Report
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Total Attributed Revenue</h5>
                <p className="text-2xl font-bold text-gray-900">$451,400</p>
                <p className="text-sm text-green-600 mt-1">↑ 18% from previous period</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Average ROI</h5>
                <p className="text-2xl font-bold text-gray-900">315%</p>
                <p className="text-sm text-green-600 mt-1">↑ 12% from previous period</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Attribution Model</h5>
                <p className="text-2xl font-bold text-gray-900">Algorithmic</p>
                <p className="text-sm text-blue-600 mt-1">AI-powered multi-touch attribution</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h5 className="text-sm font-medium text-gray-700 mb-4">Channel Revenue Attribution</h5>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex flex-col space-y-4">
                  {channels.map(channel => (
                    <div 
                      key={channel.id}
                      className={`cursor-pointer transition-all ${selectedChannel === channel.id ? 'scale-105' : ''}`}
                      onClick={() => handleChannelClick(channel.id)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${getColorClass(channel.color)}`}></div>
                          <span className="text-sm font-medium text-gray-900">{channel.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{channel.revenue}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`${getColorClass(channel.color)} h-2.5 rounded-full`} 
                          style={{ width: channel.contribution }}
                        ></div>
                      </div>
                      
                      {selectedChannel === channel.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                          className="mt-2 p-3 bg-white rounded-lg shadow-sm"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Contribution</p>
                              <p className="text-sm font-medium text-gray-900">{channel.contribution} of total revenue</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">ROI</p>
                              <p className="text-sm font-medium text-gray-900">{channel.roi}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Conversions</p>
                              <p className="text-sm font-medium text-gray-900">245</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Cost per Conversion</p>
                              <p className="text-sm font-medium text-gray-900">$42.80</p>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                              View Detailed Report
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-4">Multi-Touch Attribution Insights</h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h6 className="font-medium text-gray-900 mb-1">Top Converting Paths</h6>
                      <p className="text-xs text-gray-600 mb-2">Most effective customer journey sequences</p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClassLight('blue')}`}>Paid Search</span>
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClassLight('yellow')}`}>Email</span>
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClassLight('purple')}`}>Social Media</span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h6 className="font-medium text-gray-900 mb-1">Undervalued Channels</h6>
                      <p className="text-xs text-gray-600 mb-2">Channels contributing more than last-touch suggests</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClassLight('green')}`}>Organic Search (+32%)</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClassLight('purple')}`}>Social Media (+18%)</span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h6 className="font-medium text-gray-900 mb-1">Conversion Time Analysis</h6>
                      <p className="text-xs text-gray-600 mb-2">Average time from first touch to conversion</p>
                      <p className="text-sm font-medium text-gray-900">12 days (↓ 2 days from previous period)</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-4">AI-Generated Recommendations</h5>
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <div className="space-y-4">
                    <div>
                      <h6 className="font-medium text-gray-900 mb-1">Channel Optimization</h6>
                      <p className="text-sm text-gray-600">Increase email marketing budget by 30% to capitalize on high ROI (410%). Potential to generate additional $22,400 in revenue.</p>
                    </div>
                    
                    <div>
                      <h6 className="font-medium text-gray-900 mb-1">Sequence Optimization</h6>
                      <p className="text-sm text-gray-600">Add social media retargeting between organic search and email touchpoints to improve conversion rate by an estimated 15%.</p>
                    </div>
                    
                    <div>
                      <h6 className="font-medium text-gray-900 mb-1">Content Recommendation</h6>
                      <p className="text-sm text-gray-600">Create more educational content for organic search to strengthen its position as an initial touchpoint in high-value journeys.</p>
                    </div>
                    
                    <div className="flex justify-end">
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                        Apply Recommendations
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'models' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Attribution Models Comparison</h4>
              <p className="text-gray-600 mb-6">Compare how different attribution models distribute credit for conversions across marketing touchpoints.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {attributionModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-4 rounded-lg text-left transition-colors ${
                      selectedModel === model.id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <h5 className={`font-medium mb-1 ${selectedModel === model.id ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {model.label}
                    </h5>
                    <p className="text-xs text-gray-600">{model.description}</p>
                  </button>
                ))}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h5 className="text-sm font-medium text-gray-700 mb-4">Channel Attribution by Model</h5>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Channel</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">First Touch</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Touch</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Linear</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Time Decay</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Position Based</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Algorithmic (AI)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {channels.map(channel => (
                        <tr key={channel.id} className={selectedModel === 'algorithmic' ? (channel.id === 'email' ? 'bg-indigo-50' : '') : ''}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${getColorClass(channel.color)}`}></div>
                              <span className="font-medium text-gray-900">{channel.name}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {channel.id === 'organic-search' ? '35%' : 
                             channel.id === 'paid-search' ? '28%' : 
                             channel.id === 'social-media' ? '22%' : 
                             channel.id === 'email' ? '8%' : 
                             channel.id === 'direct' ? '5%' : '2%'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {channel.id === 'direct' ? '32%' : 
                             channel.id === 'paid-search' ? '25%' : 
                             channel.id === 'email' ? '18%' : 
                             channel.id === 'organic-search' ? '12%' : 
                             channel.id === 'social-media' ? '8%' : '5%'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {channel.id === 'paid-search' ? '24%' : 
                             channel.id === 'organic-search' ? '22%' : 
                             channel.id === 'social-media' ? '18%' : 
                             channel.id === 'email' ? '15%' : 
                             channel.id === 'direct' ? '12%' : '9%'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {channel.id === 'paid-search' ? '26%' : 
                             channel.id === 'email' ? '22%' : 
                             channel.id === 'direct' ? '18%' : 
                             channel.id === 'social-media' ? '15%' : 
                             channel.id === 'organic-search' ? '12%' : '7%'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {channel.id === 'organic-search' ? '25%' : 
                             channel.id === 'paid-search' ? '24%' : 
                             channel.id === 'direct' ? '18%' : 
                             channel.id === 'social-media' ? '15%' : 
                             channel.id === 'email' ? '12%' : '6%'}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-4 text-sm ${selectedModel === 'algorithmic' && channel.id === 'email' ? 'font-bold text-indigo-700' : 'text-gray-500'}`}>
                            {channel.id === 'paid-search' ? '28%' : 
                             channel.id === 'organic-search' ? '22%' : 
                             channel.id === 'social-media' ? '19%' : 
                             channel.id === 'email' ? '15%' : 
                             channel.id === 'direct' ? '10%' : '6%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {selectedModel === 'algorithmic' && (
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h6 className="text-sm font-medium text-indigo-800 mb-1">AI Model Insights</h6>
                    <p className="text-xs text-indigo-700">The algorithmic model has identified that Email Marketing is undervalued by traditional models. While it appears as a middle or late-stage touchpoint, its influence on conversion decisions is 15% higher than last-touch attribution suggests.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h5 className="text-lg font-medium text-gray-900 mb-4">Model Configuration</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Attribution Model</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {attributionModels.map(model => (
                      <option key={model.id} value={model.id}>{model.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lookback Window</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                    <option>Custom</option>
                  </select>
                </div>
                
                {selectedModel === 'algorithmic' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">AI Model Training Frequency</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option>Weekly</option>
                        <option>Bi-weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Conversion Types to Include</label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            id="purchase"
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked
                          />
                          <label htmlFor="purchase" className="ml-2 text-sm text-gray-700">
                            Purchases
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="signup"
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked
                          />
                          <label htmlFor="signup" className="ml-2 text-sm text-gray-700">
                            Sign-ups
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="download"
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked
                          />
                          <label htmlFor="download" className="ml-2 text-sm text-gray-700">
                            Downloads
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-medium transition-colors">
                  Apply Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'journeys' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Customer Journey Analysis</h4>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                  <option>All Journeys</option>
                  <option>High Value ($1000+)</option>
                  <option>Medium Value</option>
                  <option>Low Value</option>
                </select>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Export Data
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              {journeys.map(journey => (
                <div key={journey.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h5 className="font-medium text-gray-900">{journey.customer}</h5>
                      <p className="text-sm text-gray-500">Conversion Value: {journey.value}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="relative">
                      {/* Journey Path Visualization */}
                      <div className="flex items-center mb-4">
                        {/* Connecting Line */}
                        <div className="absolute h-0.5 bg-gray-200 left-0 right-0 top-4 z-0"></div>
                        
                        {/* Journey Touchpoints */}
                        <div className="flex justify-between items-center w-full relative z-10">
                          {journey.touchpoints.map((touchpoint, index) => (
                            <div key={index} className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                touchpoint.channel === 'Paid Search' ? 'bg-blue-500' :
                                touchpoint.channel === 'Organic Search' ? 'bg-green-500' :
                                touchpoint.channel === 'Social Media' ? 'bg-purple-500' :
                                touchpoint.channel === 'Email' ? 'bg-yellow-500' :
                                touchpoint.channel === 'Direct' ? 'bg-red-500' :
                                touchpoint.channel === 'Website' ? 'bg-gray-500' :
                                'bg-indigo-500'
                              }`}>
                                {index + 1}
                              </div>
                              <span className="mt-1 text-xs text-gray-600 whitespace-nowrap">{touchpoint.channel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-2">
                        {journey.touchpoints.map((touchpoint, index) => (
                          <div key={index} className="flex items-start">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2 ${
                              touchpoint.channel === 'Paid Search' ? 'bg-blue-500' :
                              touchpoint.channel === 'Organic Search' ? 'bg-green-500' :
                              touchpoint.channel === 'Social Media' ? 'bg-purple-500' :
                              touchpoint.channel === 'Email' ? 'bg-yellow-500' :
                              touchpoint.channel === 'Direct' ? 'bg-red-500' :
                              touchpoint.channel === 'Website' ? 'bg-gray-500' :
                              'bg-indigo-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{touchpoint.channel}</p>
                              <div className="flex text-xs text-gray-500 space-x-2">
                                <span>{touchpoint.date}</span>
                                <span>•</span>
                                <span>{touchpoint.interaction}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Attribution Analysis</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">First Touch</p>
                            <p className="text-sm font-medium text-gray-900">{journey.touchpoints[0].channel} (100%)</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Last Touch</p>
                            <p className="text-sm font-medium text-gray-900">{journey.touchpoints[journey.touchpoints.length - 1].channel} (100%)</p>
                          </div>
                          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            <p className="text-xs text-indigo-700 mb-1">AI Attribution</p>
                            <div className="space-y-1">
                              {journey.touchpoints.map((touchpoint, index) => {
                                // Generate some sample attribution percentages
                                const percentage = 
                                  index === 0 ? '25%' : 
                                  index === journey.touchpoints.length - 1 ? '30%' :
                                  touchpoint.channel === 'Email' ? '20%' :
                                  touchpoint.channel === 'Social Media' ? '15%' :
                                  '10%';
                                
                                return (
                                  <div key={index} className="flex justify-between items-center">
                                    <span className="text-xs text-gray-700">{touchpoint.channel}</span>
                                    <span className="text-xs font-medium text-indigo-700">{percentage}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-indigo-50 rounded-lg p-6 border border-indigo-100">
              <h5 className="text-lg font-medium text-gray-900 mb-4">Journey Pattern Insights</h5>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h6 className="font-medium text-gray-900 mb-2">Common Conversion Paths</h6>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                          <span className="text-xs text-gray-700">Paid Search</span>
                        </div>
                        <svg className="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                          <span className="text-xs text-gray-700">Email</span>
                        </div>
                        <svg className="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
                          <span className="text-xs text-gray-700">Website</span>
                        </div>
                        <div className="ml-auto text-xs font-medium text-gray-900">28% of conversions</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '28%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                          <span className="text-xs text-gray-700">Organic</span>
                        </div>
                        <svg className="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
                          <span className="text-xs text-gray-700">Website</span>
                        </div>
                        <svg className="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                          <span className="text-xs text-gray-700">Direct</span>
                        </div>
                        <div className="ml-auto text-xs font-medium text-gray-900">22% of conversions</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '22%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h6 className="font-medium text-gray-900 mb-2">Journey Length Analysis</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Number of Touchpoints Before Conversion</p>
                      <div className="h-32 flex items-end space-x-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 bg-indigo-300 rounded-t-lg" style={{ height: '30%' }}></div>
                          <p className="mt-1 text-xs text-gray-600">1-2</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-10 bg-indigo-400 rounded-t-lg" style={{ height: '60%' }}></div>
                          <p className="mt-1 text-xs text-gray-600">3-4</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-10 bg-indigo-500 rounded-t-lg" style={{ height: '90%' }}></div>
                          <p className="mt-1 text-xs text-gray-600">5-6</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-10 bg-indigo-600 rounded-t-lg" style={{ height: '45%' }}></div>
                          <p className="mt-1 text-xs text-gray-600">7+</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Average Journey Duration</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">High Value ($1000+)</span>
                            <span className="text-xs font-medium text-gray-900">18 days</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Medium Value</span>
                            <span className="text-xs font-medium text-gray-900">12 days</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '50%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Low Value</span>
                            <span className="text-xs font-medium text-gray-900">5 days</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'budget' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">AI Budget Optimization</h4>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                  <option>Current Quarter</option>
                  <option>Next Quarter</option>
                  <option>Custom Period</option>
                </select>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Apply Recommendations
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Current Marketing Budget</h5>
                <p className="text-2xl font-bold text-gray-900">$93,000</p>
                <p className="text-sm text-gray-600 mt-1">Quarterly allocation</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Recommended Budget</h5>
                <p className="text-2xl font-bold text-indigo-600">$104,200</p>
                <p className="text-sm text-green-600 mt-1">+12% for optimal performance</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Projected ROI Improvement</h5>
                <p className="text-2xl font-bold text-gray-900">+18%</p>
                <p className="text-sm text-gray-600 mt-1">Based on attribution data</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h5 className="text-sm font-medium text-gray-700 mb-4">Channel Budget Recommendations</h5>
              
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Channel</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Current Budget</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Recommended</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Change</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Projected Impact</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {budgetRecommendations.map((rec) => (
                      <tr key={rec.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{rec.channel}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{rec.currentBudget}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">{rec.recommendedBudget}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={rec.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                            {rec.change}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{rec.impact}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`font-medium ${getConfidenceColor(rec.confidence)}`}>
                            {rec.confidence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-4">Budget Allocation Visualization</h5>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col space-y-4">
                    {budgetRecommendations.map(rec => {
                      const currentWidth = parseInt(rec.currentBudget.replace(/[^0-9]/g, ''));
                      const recommendedWidth = parseInt(rec.recommendedBudget.replace(/[^0-9]/g, ''));
                      const maxWidth = Math.max(currentWidth, recommendedWidth);
                      
                      return (
                        <div key={rec.id}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-900">{rec.channel}</span>
                          </div>
                          <div className="relative h-8">
                            <div 
                              className="absolute top-0 left-0 h-8 bg-gray-200 rounded-lg"
                              style={{ width: `${(currentWidth / maxWidth) * 100}%` }}
                            >
                              <div className="h-full flex items-center justify-end px-2">
                                <span className="text-xs font-medium text-gray-700">{rec.currentBudget}</span>
                              </div>
                            </div>
                            <div 
                              className={`absolute top-0 left-0 h-4 mt-2 ${rec.change.startsWith('+') ? 'bg-green-500' : 'bg-red-500'} rounded-lg`}
                              style={{ width: `${(recommendedWidth / maxWidth) * 100}%` }}
                            >
                              <div className="h-full flex items-center justify-end px-2">
                                <span className="text-xs font-medium text-white">{rec.recommendedBudget}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center space-x-6">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-200 rounded mr-1"></div>
                      <span className="text-xs text-gray-600">Current</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                      <span className="text-xs text-gray-600">Recommended Increase</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                      <span className="text-xs text-gray-600">Recommended Decrease</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-4">Implementation Plan</h5>
                <div className="bg-indigo-50 rounded-lg border border-indigo-100 p-4">
                  <div className="space-y-4">
                    <div>
                      <h6 className="text-sm font-medium text-gray-900 mb-1">Phase 1: Email Marketing Expansion</h6>
                      <p className="text-xs text-gray-600">Increase email marketing budget by 30% to capitalize on high ROI. Focus on improving segmentation and personalization.</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Timeline: 2 weeks</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Very High Priority</span>
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="text-sm font-medium text-gray-900 mb-1">Phase 2: Paid Search Optimization</h6>
                      <p className="text-xs text-gray-600">Increase paid search budget by 20% with focus on high-converting keywords and improved ad copy based on semantic content analysis.</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Timeline: 3 weeks</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">High Priority</span>
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="text-sm font-medium text-gray-900 mb-1">Phase 3: Social Media Enhancement</h6>
                      <p className="text-xs text-gray-600">Increase social media budget by 15% with emphasis on retargeting campaigns and improved creative assets.</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Timeline: 4 weeks</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Medium Priority</span>
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="text-sm font-medium text-gray-900 mb-1">Phase 4: Display Advertising Reduction</h6>
                      <p className="text-xs text-gray-600">Gradually reduce display advertising budget by 20% and reallocate to higher-performing channels.</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Timeline: 6 weeks</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Low Priority</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                      Start Implementation
                    </button>
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

export default RevenueAttributionAI;
