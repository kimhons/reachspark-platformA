import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const OmnichannelPersonalization = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('profiles');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState('all');

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
    { id: 'profiles', label: 'Customer Profiles' },
    { id: 'personalization', label: 'Personalization Engine' },
    { id: 'campaigns', label: 'Personalized Campaigns' },
    { id: 'analytics', label: 'Performance Analytics' }
  ];

  const channels = [
    { id: 'all', label: 'All Channels' },
    { id: 'web', label: 'Website' },
    { id: 'mobile', label: 'Mobile App' },
    { id: 'email', label: 'Email' },
    { id: 'sms', label: 'SMS' },
    { id: 'social', label: 'Social Media' }
  ];

  const customerProfiles = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      segment: 'High-Value Customer',
      lifetimeValue: '$2,450',
      lastActive: '2 hours ago',
      interests: ['Fitness', 'Nutrition', 'Outdoor Activities'],
      recentPurchases: [
        { product: 'Premium Yoga Mat', date: '2025-04-10', price: '$89.99' },
        { product: 'Fitness Tracker', date: '2025-03-22', price: '$129.99' }
      ],
      channelPreferences: {
        email: 'High',
        mobile: 'Medium',
        web: 'High',
        social: 'Medium',
        sms: 'Low'
      },
      nextBestActions: [
        'Send personalized workout plan email',
        'Recommend nutrition supplements',
        'Offer early access to new fitness collection'
      ]
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.c@example.com',
      segment: 'Frequent Browser',
      lifetimeValue: '$780',
      lastActive: '1 day ago',
      interests: ['Technology', 'Gaming', 'Electronics'],
      recentPurchases: [
        { product: 'Wireless Headphones', date: '2025-02-15', price: '$149.99' }
      ],
      channelPreferences: {
        email: 'Medium',
        mobile: 'High',
        web: 'High',
        social: 'High',
        sms: 'Low'
      },
      nextBestActions: [
        'Send mobile app notification about new tech arrivals',
        'Recommend gaming accessories based on browsing history',
        'Offer limited-time discount on electronics'
      ]
    },
    {
      id: 3,
      name: 'Emma Rodriguez',
      email: 'emma.r@example.com',
      segment: 'New Customer',
      lifetimeValue: '$120',
      lastActive: '5 hours ago',
      interests: ['Fashion', 'Beauty', 'Lifestyle'],
      recentPurchases: [
        { product: 'Designer Handbag', date: '2025-04-18', price: '$120.00' }
      ],
      channelPreferences: {
        email: 'Medium',
        mobile: 'Low',
        web: 'Medium',
        social: 'High',
        sms: 'Medium'
      },
      nextBestActions: [
        'Send welcome series email with style quiz',
        'Show personalized product recommendations on homepage',
        'Invite to loyalty program via social media'
      ]
    }
  ];

  const personalizationTypes = [
    {
      id: 'content',
      name: 'Content Personalization',
      description: 'Dynamically adjust content based on user preferences, behavior, and context',
      channels: ['Website', 'Mobile App', 'Email'],
      examples: [
        'Dynamic homepage hero sections',
        'Personalized product recommendations',
        'Custom email content blocks'
      ]
    },
    {
      id: 'offers',
      name: 'Offer Personalization',
      description: 'Present tailored promotions, discounts, and special offers to each customer',
      channels: ['Email', 'SMS', 'Website', 'Mobile App'],
      examples: [
        'Birthday discounts',
        'Loyalty tier-based promotions',
        'Abandoned cart offers'
      ]
    },
    {
      id: 'journey',
      name: 'Journey Personalization',
      description: 'Create individualized customer journeys across multiple touchpoints',
      channels: ['All Channels'],
      examples: [
        'Onboarding sequences',
        'Post-purchase follow-ups',
        'Re-engagement campaigns'
      ]
    },
    {
      id: 'timing',
      name: 'Timing Personalization',
      description: 'Deliver messages at the optimal time for each individual customer',
      channels: ['Email', 'SMS', 'Push Notifications'],
      examples: [
        'Time zone-based delivery',
        'Behavioral pattern-based timing',
        'Real-time triggered messages'
      ]
    }
  ];

  const campaigns = [
    {
      id: 1,
      name: 'Welcome Series',
      status: 'Active',
      audience: 'New Customers',
      channels: ['Email', 'Website'],
      personalization: 'High',
      performance: '32% conversion rate',
      startDate: '2025-01-15',
      endDate: 'Ongoing'
    },
    {
      id: 2,
      name: 'Abandoned Cart Recovery',
      status: 'Active',
      audience: 'All Segments',
      channels: ['Email', 'SMS', 'Retargeting Ads'],
      personalization: 'Very High',
      performance: '28% recovery rate',
      startDate: '2025-02-10',
      endDate: 'Ongoing'
    },
    {
      id: 3,
      name: 'VIP Customer Appreciation',
      status: 'Scheduled',
      audience: 'High-Value Customers',
      channels: ['Email', 'Direct Mail', 'Website'],
      personalization: 'Very High',
      performance: 'Pending',
      startDate: '2025-05-01',
      endDate: '2025-05-31'
    },
    {
      id: 4,
      name: 'Product Recommendations',
      status: 'Active',
      audience: 'All Segments',
      channels: ['Website', 'Mobile App', 'Email'],
      personalization: 'High',
      performance: '18% click-through rate',
      startDate: '2025-03-01',
      endDate: 'Ongoing'
    }
  ];

  const analyticsData = {
    conversionRates: [
      { channel: 'Non-personalized', rate: 2.4 },
      { channel: 'Personalized', rate: 5.8 }
    ],
    engagementByChannel: [
      { channel: 'Email', personalized: 28, standard: 12 },
      { channel: 'Website', personalized: 32, standard: 15 },
      { channel: 'Mobile App', personalized: 38, standard: 18 },
      { channel: 'SMS', personalized: 24, standard: 10 },
      { channel: 'Social Media', personalized: 22, standard: 14 }
    ],
    customerSatisfaction: [
      { segment: 'With Personalization', score: 8.7 },
      { segment: 'Without Personalization', score: 6.2 }
    ]
  };

  const handleProfileClick = (profile) => {
    setSelectedProfile(profile);
  };

  const getPreferenceColor = (level) => {
    const preferenceColors = {
      'High': 'bg-green-500',
      'Medium': 'bg-yellow-500',
      'Low': 'bg-red-500'
    };
    return preferenceColors[level] || 'bg-gray-500';
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Active': 'bg-green-100 text-green-800',
      'Scheduled': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-gray-100 text-gray-800',
      'Draft': 'bg-yellow-100 text-yellow-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPersonalizationColor = (level) => {
    const personalizationColors = {
      'Very High': 'bg-purple-100 text-purple-800',
      'High': 'bg-blue-100 text-blue-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-gray-100 text-gray-800'
    };
    return personalizationColors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
        <h3 className="text-xl font-bold text-white">Omnichannel Personalization Engine</h3>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'profiles' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Unified Customer Profiles</h4>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500">
                  <option>All Segments</option>
                  <option>High-Value Customers</option>
                  <option>Frequent Browsers</option>
                  <option>New Customers</option>
                  <option>At-Risk Customers</option>
                </select>
                <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Create Segment
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  <h5 className="text-sm font-medium text-gray-700 mb-4">Customer List</h5>
                  <div className="space-y-3">
                    {customerProfiles.map(profile => (
                      <div 
                        key={profile.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedProfile?.id === profile.id 
                            ? 'bg-purple-50 border border-purple-200' 
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleProfileClick(profile)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h6 className="font-medium text-gray-900">{profile.name}</h6>
                            <p className="text-xs text-gray-500">{profile.email}</p>
                          </div>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {profile.segment}
                          </span>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-xs text-gray-600">LTV: {profile.lifetimeValue}</span>
                          <span className="text-xs text-gray-600">Active: {profile.lastActive}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                {selectedProfile ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="text-lg font-medium text-gray-900">{selectedProfile.name}</h5>
                        <p className="text-sm text-gray-600">{selectedProfile.email}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                          Edit Profile
                        </button>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm font-medium transition-colors">
                          Take Action
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Segment</p>
                        <p className="text-sm font-medium text-gray-900">{selectedProfile.segment}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Lifetime Value</p>
                        <p className="text-sm font-medium text-gray-900">{selectedProfile.lifetimeValue}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Last Active</p>
                        <p className="text-sm font-medium text-gray-900">{selectedProfile.lastActive}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Interests & Preferences</h6>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.interests.map((interest, index) => (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Channel Preferences</h6>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(selectedProfile.channelPreferences).map(([channel, preference]) => (
                          <div key={channel} className="flex flex-col items-center">
                            <div className="w-full h-1.5 bg-gray-200 rounded-full mb-1">
                              <div 
                                className={`h-1.5 rounded-full ${getPreferenceColor(preference)}`} 
                                style={{ width: preference === 'High' ? '100%' : preference === 'Medium' ? '60%' : '30%' }}
                              ></div>
                            </div>
                            <div className="flex justify-between w-full">
                              <span className="text-xs text-gray-600 capitalize">{channel}</span>
                              <span className="text-xs font-medium text-gray-900">{preference}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Recent Purchases</h6>
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900">Product</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Date</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {selectedProfile.recentPurchases.map((purchase, index) => (
                              <tr key={index}>
                                <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900">{purchase.product}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{purchase.date}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{purchase.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">AI-Recommended Next Best Actions</h6>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                        <ul className="space-y-2">
                          {selectedProfile.nextBestActions.map((action, index) => (
                            <li key={index} className="flex items-start">
                              <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                              </svg>
                              <span className="text-sm text-gray-700">{action}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex justify-end">
                          <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
                            Execute Actions
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 h-full flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h5 className="text-lg font-medium text-gray-900 mb-2">Select a Customer Profile</h5>
                    <p className="text-gray-600 text-center">Click on a customer from the list to view their unified profile and personalization options.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'personalization' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Personalization Engine Configuration</h4>
              <div className="flex space-x-2">
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                >
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>{channel.label}</option>
                  ))}
                </select>
                <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Create Rule
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {personalizationTypes.map(type => (
                <div 
                  key={type.id}
                  className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <h5 className="text-lg font-medium text-gray-900 mb-2">{type.name}</h5>
                  <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                  
                  <div className="mb-4">
                    <h6 className="text-xs font-medium text-gray-700 mb-2">Available Channels</h6>
                    <div className="flex flex-wrap gap-2">
                      {type.channels.map((channel, index) => (
                        <span 
                          key={index} 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedChannel === 'all' || 
                            channel === 'All Channels' || 
                            channel.toLowerCase().includes(selectedChannel)
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-xs font-medium text-gray-700 mb-2">Examples</h6>
                    <ul className="space-y-1">
                      {type.examples.map((example, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <svg className="w-4 h-4 text-purple-500 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                          </svg>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors flex items-center">
                      Configure
                      <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h5 className="text-lg font-medium text-gray-900 mb-4">Personalization Rules</h5>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h6 className="font-medium text-gray-900">Homepage Hero Section</h6>
                      <p className="text-xs text-gray-500">Displays different hero banners based on customer interests</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Channel</p>
                      <p className="text-sm text-gray-900">Website</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-sm text-gray-900">Content Personalization</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Priority</p>
                      <p className="text-sm text-gray-900">High</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button className="text-gray-600 hover:text-gray-800 text-xs font-medium">Edit</button>
                    <button className="text-purple-600 hover:text-purple-800 text-xs font-medium">View Details</button>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h6 className="font-medium text-gray-900">Product Recommendations</h6>
                      <p className="text-xs text-gray-500">Shows personalized product suggestions based on browsing and purchase history</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Channel</p>
                      <p className="text-sm text-gray-900">Website, Email, Mobile App</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-sm text-gray-900">Content Personalization</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Priority</p>
                      <p className="text-sm text-gray-900">High</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button className="text-gray-600 hover:text-gray-800 text-xs font-medium">Edit</button>
                    <button className="text-purple-600 hover:text-purple-800 text-xs font-medium">View Details</button>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h6 className="font-medium text-gray-900">Abandoned Cart Offers</h6>
                      <p className="text-xs text-gray-500">Sends personalized offers based on cart value and customer segment</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Channel</p>
                      <p className="text-sm text-gray-900">Email, SMS</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-sm text-gray-900">Offer Personalization</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Priority</p>
                      <p className="text-sm text-gray-900">Medium</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button className="text-gray-600 hover:text-gray-800 text-xs font-medium">Edit</button>
                    <button className="text-purple-600 hover:text-purple-800 text-xs font-medium">View Details</button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Create New Rule
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'campaigns' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Personalized Campaigns</h4>
              <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Campaign
              </button>
            </div>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg mb-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Campaign Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Audience</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Channels</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Personalization</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Performance</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-gray-500">{campaign.startDate} to {campaign.endDate}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{campaign.audience}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {campaign.channels.map((channel, index) => (
                            <span key={index} className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonalizationColor(campaign.personalization)}`}>
                          {campaign.personalization}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{campaign.performance}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <a href="#" className="text-purple-600 hover:text-purple-900 mr-4">Edit</a>
                        <a href="#" className="text-purple-600 hover:text-purple-900">View</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h5 className="text-lg font-medium text-gray-900 mb-4">Campaign Builder</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter campaign name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                        <option>All Customers</option>
                        <option>High-Value Customers</option>
                        <option>New Customers</option>
                        <option>At-Risk Customers</option>
                        <option>Custom Segment</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            id="channel-email"
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            checked
                          />
                          <label htmlFor="channel-email" className="ml-2 text-sm text-gray-700">
                            Email
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="channel-website"
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            checked
                          />
                          <label htmlFor="channel-website" className="ml-2 text-sm text-gray-700">
                            Website
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="channel-mobile"
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="channel-mobile" className="ml-2 text-sm text-gray-700">
                            Mobile App
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="channel-sms"
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="channel-sms" className="ml-2 text-sm text-gray-700">
                            SMS
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Duration</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                          <input
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">End Date</label>
                          <input
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Personalization Level</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                        <option>Very High - Individual Level</option>
                        <option>High - Micro-Segment Level</option>
                        <option>Medium - Segment Level</option>
                        <option>Low - Basic Personalization</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Personalization Types</label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            id="type-content"
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            checked
                          />
                          <label htmlFor="type-content" className="ml-2 text-sm text-gray-700">
                            Content Personalization
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="type-offers"
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            checked
                          />
                          <label htmlFor="type-offers" className="ml-2 text-sm text-gray-700">
                            Offer Personalization
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="type-timing"
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="type-timing" className="ml-2 text-sm text-gray-700">
                            Timing Personalization
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">AI-Generated Content</label>
                      <div className="flex items-center">
                        <input
                          id="ai-content"
                          type="checkbox"
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          checked
                        />
                        <label htmlFor="ai-content" className="ml-2 text-sm text-gray-700">
                          Use AI to generate personalized content variations
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Performance Goals</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                        <option>Conversion Rate</option>
                        <option>Click-Through Rate</option>
                        <option>Revenue Generation</option>
                        <option>Customer Engagement</option>
                        <option>Customer Retention</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Save as Draft
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Create Campaign
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Personalization Performance</h4>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500">
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Last Year</option>
                  <option>Custom Range</option>
                </select>
                <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Export Report
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Conversion Rate Lift</h5>
                <p className="text-2xl font-bold text-gray-900">+142%</p>
                <p className="text-sm text-green-600 mt-1">↑ 12% from previous period</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Average Order Value Increase</h5>
                <p className="text-2xl font-bold text-gray-900">+28%</p>
                <p className="text-sm text-green-600 mt-1">↑ 5% from previous period</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Customer Satisfaction</h5>
                <p className="text-2xl font-bold text-gray-900">8.7/10</p>
                <p className="text-sm text-green-600 mt-1">↑ 0.5 from previous period</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h5 className="text-sm font-medium text-gray-700 mb-4">Conversion Rate Comparison</h5>
                <div className="h-64 flex items-end space-x-12 justify-center">
                  {analyticsData.conversionRates.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className={`w-24 ${index === 0 ? 'bg-gray-400' : 'bg-purple-500'} rounded-t-lg`} 
                        style={{ height: `${item.rate * 10}%` }}
                      ></div>
                      <div className="mt-2 text-center">
                        <p className="text-sm font-medium text-gray-900">{item.rate}%</p>
                        <p className="text-xs text-gray-600">{item.channel}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Personalization increases conversion rates by 142% on average</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h5 className="text-sm font-medium text-gray-700 mb-4">Customer Satisfaction Comparison</h5>
                <div className="h-64 flex items-end space-x-12 justify-center">
                  {analyticsData.customerSatisfaction.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className={`w-24 ${index === 0 ? 'bg-purple-500' : 'bg-gray-400'} rounded-t-lg`} 
                        style={{ height: `${item.score * 10}%` }}
                      ></div>
                      <div className="mt-2 text-center">
                        <p className="text-sm font-medium text-gray-900">{item.score}/10</p>
                        <p className="text-xs text-gray-600">{item.segment}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Personalization increases customer satisfaction by 40% on average</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h5 className="text-sm font-medium text-gray-700 mb-4">Engagement by Channel</h5>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="h-64 flex items-end space-x-8">
                    {analyticsData.engagementByChannel.map((item, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className="flex space-x-2 h-52 items-end">
                          <div 
                            className="w-12 bg-purple-500 rounded-t-lg" 
                            style={{ height: `${item.personalized * 2}%` }}
                          ></div>
                          <div 
                            className="w-12 bg-gray-400 rounded-t-lg" 
                            style={{ height: `${item.standard * 2}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs text-gray-600">{item.channel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded mr-1"></div>
                  <span className="text-xs text-gray-600">Personalized</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded mr-1"></div>
                  <span className="text-xs text-gray-600">Standard</span>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
              <h5 className="text-lg font-medium text-gray-900 mb-4">AI-Generated Insights</h5>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h6 className="font-medium text-gray-900 mb-2">Channel Effectiveness</h6>
                  <p className="text-sm text-gray-600">Mobile app personalization shows the highest engagement lift (+111%). Consider increasing personalization efforts on this channel and expanding to push notifications.</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h6 className="font-medium text-gray-900 mb-2">Segment Opportunities</h6>
                  <p className="text-sm text-gray-600">High-value customers respond best to exclusive offer personalization (+38% conversion vs. other segments). Create more VIP-exclusive personalized experiences to increase loyalty and lifetime value.</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h6 className="font-medium text-gray-900 mb-2">Content Optimization</h6>
                  <p className="text-sm text-gray-600">Product recommendation algorithms are 27% more effective when combined with personalized content descriptions. Implement this approach across all channels for maximum impact.</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Generate Detailed Report
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OmnichannelPersonalization;
