import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const InfluencerMarketplace = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAudience, setSelectedAudience] = useState('all');

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
    { id: 'discover', label: 'Discover Influencers' },
    { id: 'campaigns', label: 'My Campaigns' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' }
  ];

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'fashion', label: 'Fashion & Style' },
    { id: 'beauty', label: 'Beauty' },
    { id: 'fitness', label: 'Fitness & Health' },
    { id: 'tech', label: 'Technology' },
    { id: 'food', label: 'Food & Cooking' },
    { id: 'travel', label: 'Travel' },
    { id: 'business', label: 'Business & Finance' }
  ];

  const audiences = [
    { id: 'all', label: 'All Audiences' },
    { id: 'gen-z', label: 'Gen Z' },
    { id: 'millennials', label: 'Millennials' },
    { id: 'gen-x', label: 'Gen X' },
    { id: 'boomers', label: 'Baby Boomers' }
  ];

  const influencers = [
    {
      id: 1,
      name: 'Alex Morgan',
      handle: '@alexcreates',
      category: 'fashion',
      audience: 'millennials',
      followers: '1.2M',
      engagement: '3.8%',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      match: 92,
      bio: 'Fashion designer and style influencer sharing daily outfit inspiration and sustainable fashion tips.'
    },
    {
      id: 2,
      name: 'James Wilson',
      handle: '@jameswtech',
      category: 'tech',
      audience: 'gen-z',
      followers: '845K',
      engagement: '4.2%',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      match: 88,
      bio: 'Tech reviewer and gadget enthusiast. I break down complex tech concepts and share honest product reviews.'
    },
    {
      id: 3,
      name: 'Sophia Chen',
      handle: '@sophiaeats',
      category: 'food',
      audience: 'millennials',
      followers: '670K',
      engagement: '5.1%',
      image: 'https://randomuser.me/api/portraits/women/64.jpg',
      match: 95,
      bio: 'Chef and food blogger sharing easy-to-follow recipes, cooking tips, and restaurant recommendations.'
    },
    {
      id: 4,
      name: 'Marcus Johnson',
      handle: '@marcusfitness',
      category: 'fitness',
      audience: 'gen-z',
      followers: '1.5M',
      engagement: '3.5%',
      image: 'https://randomuser.me/api/portraits/men/22.jpg',
      match: 79,
      bio: 'Personal trainer and fitness coach helping you achieve your health goals with practical workout routines.'
    },
    {
      id: 5,
      name: 'Emma Roberts',
      handle: '@emmatravels',
      category: 'travel',
      audience: 'millennials',
      followers: '920K',
      engagement: '4.7%',
      image: 'https://randomuser.me/api/portraits/women/29.jpg',
      match: 86,
      bio: 'Travel blogger exploring hidden gems around the world. Sharing travel tips, itineraries, and photography.'
    },
    {
      id: 6,
      name: 'David Kim',
      handle: '@davidfinance',
      category: 'business',
      audience: 'gen-x',
      followers: '580K',
      engagement: '3.2%',
      image: 'https://randomuser.me/api/portraits/men/76.jpg',
      match: 91,
      bio: 'Financial advisor and entrepreneur sharing investment strategies and business insights for long-term growth.'
    }
  ];

  const campaigns = [
    {
      id: 1,
      name: 'Summer Collection Launch',
      status: 'active',
      influencers: 8,
      budget: '$15,000',
      startDate: '2025-05-15',
      endDate: '2025-06-30',
      performance: 'Excellent'
    },
    {
      id: 2,
      name: 'Product Review Campaign',
      status: 'scheduled',
      influencers: 5,
      budget: '$8,500',
      startDate: '2025-07-01',
      endDate: '2025-07-31',
      performance: 'Pending'
    },
    {
      id: 3,
      name: 'Holiday Special Promotion',
      status: 'draft',
      influencers: 12,
      budget: '$25,000',
      startDate: '2025-11-15',
      endDate: '2025-12-31',
      performance: 'Pending'
    },
    {
      id: 4,
      name: 'Brand Awareness Campaign',
      status: 'completed',
      influencers: 10,
      budget: '$18,000',
      startDate: '2025-02-01',
      endDate: '2025-03-15',
      performance: 'Good'
    }
  ];

  const filteredInfluencers = influencers.filter(influencer => {
    if (selectedCategory !== 'all' && influencer.category !== selectedCategory) return false;
    if (selectedAudience !== 'all' && influencer.audience !== selectedAudience) return false;
    return true;
  });

  const getStatusColor = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPerformanceColor = (performance) => {
    const performanceColors = {
      'Excellent': 'text-green-600',
      'Good': 'text-blue-600',
      'Average': 'text-yellow-600',
      'Poor': 'text-red-600',
      'Pending': 'text-gray-600'
    };
    return performanceColors[performance] || 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-4">
        <h3 className="text-xl font-bold text-white">Integrated Influencer Marketplace</h3>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'discover' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  value={selectedAudience}
                  onChange={(e) => setSelectedAudience(e.target.value)}
                >
                  {audiences.map(audience => (
                    <option key={audience.id} value={audience.id}>{audience.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInfluencers.map(influencer => (
                <div key={influencer.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img 
                      src={influencer.image} 
                      alt={influencer.name} 
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-bold text-green-800 shadow">
                      {influencer.match}% Match
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{influencer.name}</h4>
                        <p className="text-sm text-gray-600">{influencer.handle}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-gray-900">{influencer.followers}</span>
                        <span className="text-xs text-gray-600">followers</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{influencer.bio}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {categories.find(c => c.id === influencer.category)?.label}
                      </span>
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">{influencer.engagement}</span> engagement
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium transition-colors">
                        Contact
                      </button>
                      <button className="flex-1 bg-white border border-green-600 text-green-600 hover:bg-green-50 py-2 rounded text-sm font-medium transition-colors">
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredInfluencers.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No influencers found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search filters to find more matches.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'campaigns' && (
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="mb-6 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">My Campaigns</h4>
              <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Campaign
              </button>
            </div>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Campaign Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Influencers</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Budget</th>
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
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{campaign.influencers}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{campaign.budget}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`font-medium ${getPerformanceColor(campaign.performance)}`}>
                          {campaign.performance}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <a href="#" className="text-green-600 hover:text-green-900 mr-4">Edit</a>
                        <a href="#" className="text-green-600 hover:text-green-900">View</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <h4 className="text-sm font-medium text-gray-500 mb-1">Total Reach</h4>
                <p className="text-2xl font-bold text-gray-900">4.8M</p>
                <p className="text-sm text-green-600 mt-1">↑ 12% from last month</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Engagement Rate</h4>
                <p className="text-2xl font-bold text-gray-900">3.2%</p>
                <p className="text-sm text-green-600 mt-1">↑ 0.5% from last month</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">ROI</h4>
                <p className="text-2xl font-bold text-gray-900">287%</p>
                <p className="text-sm text-green-600 mt-1">↑ 23% from last month</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Campaign Performance</h4>
              <div className="h-64 flex items-end space-x-6">
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-green-600 rounded-t-lg" style={{ height: '85%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Summer</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-green-600 rounded-t-lg" style={{ height: '65%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Product</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-gray-300 rounded-t-lg" style={{ height: '45%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Holiday</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-green-600 rounded-t-lg" style={{ height: '70%' }}></div>
                  <p className="mt-2 text-xs text-gray-600">Brand</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Top Performing Influencers</h4>
              <div className="space-y-4">
                {influencers.slice(0, 3).map(influencer => (
                  <div key={influencer.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center">
                      <img 
                        src={influencer.image} 
                        alt={influencer.name} 
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <h5 className="font-medium text-gray-900">{influencer.name}</h5>
                        <p className="text-sm text-gray-600">{influencer.handle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{influencer.engagement}</p>
                      <p className="text-sm text-gray-600">engagement</p>
                    </div>
                  </div>
                ))}
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
                <h4 className="text-lg font-medium text-gray-900 mb-4">Campaign Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Campaign Duration</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                      <option>2 weeks</option>
                      <option>1 month</option>
                      <option>3 months</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Approval Workflow</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                      <option>Single Approver</option>
                      <option>Two-Step Approval</option>
                      <option>Team Approval</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 font-medium">Automatic Content Review</p>
                      <p className="text-sm text-gray-500">AI-powered content screening before publishing</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500 transition-colors focus:outline-none">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Influencer Preferences</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Follower Count</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                      <option>No minimum</option>
                      <option>5,000+</option>
                      <option>10,000+</option>
                      <option>50,000+</option>
                      <option>100,000+</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Engagement Rate</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                      <option>No minimum</option>
                      <option>1%+</option>
                      <option>2%+</option>
                      <option>3%+</option>
                      <option>5%+</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 font-medium">Verified Influencers Only</p>
                      <p className="text-sm text-gray-500">Only show influencers with verified accounts</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-400 transition-colors focus:outline-none">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium transition-colors">
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

export default InfluencerMarketplace;
