import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const JourneyVisualizer = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeJourney, setActiveJourney] = useState('purchase');
  const [activeStage, setActiveStage] = useState(null);

  useEffect(() => {
    setIsLoaded(true);
    // Set initial active stage
    setActiveStage('awareness');
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const journeyTypes = [
    { id: 'purchase', label: 'Purchase Journey' },
    { id: 'onboarding', label: 'Onboarding Journey' },
    { id: 'retention', label: 'Retention Journey' },
    { id: 'reactivation', label: 'Reactivation Journey' }
  ];

  const journeyStages = {
    purchase: [
      { id: 'awareness', label: 'Awareness', color: 'blue' },
      { id: 'consideration', label: 'Consideration', color: 'purple' },
      { id: 'decision', label: 'Decision', color: 'green' },
      { id: 'purchase', label: 'Purchase', color: 'yellow' },
      { id: 'post-purchase', label: 'Post-Purchase', color: 'red' }
    ],
    onboarding: [
      { id: 'welcome', label: 'Welcome', color: 'blue' },
      { id: 'setup', label: 'Account Setup', color: 'purple' },
      { id: 'first-use', label: 'First Use', color: 'green' },
      { id: 'value-moment', label: 'Value Moment', color: 'yellow' },
      { id: 'adoption', label: 'Full Adoption', color: 'red' }
    ],
    retention: [
      { id: 'engagement', label: 'Regular Engagement', color: 'blue' },
      { id: 'expansion', label: 'Feature Expansion', color: 'purple' },
      { id: 'advocacy', label: 'Advocacy', color: 'green' },
      { id: 'renewal', label: 'Renewal', color: 'yellow' },
      { id: 'loyalty', label: 'Loyalty Program', color: 'red' }
    ],
    reactivation: [
      { id: 'identification', label: 'Identification', color: 'blue' },
      { id: 'reengagement', label: 'Reengagement', color: 'purple' },
      { id: 'incentive', label: 'Incentive', color: 'green' },
      { id: 'return', label: 'Return', color: 'yellow' },
      { id: 'reestablish', label: 'Reestablish Value', color: 'red' }
    ]
  };

  const stageContent = {
    awareness: {
      title: 'Awareness Stage',
      description: 'Potential customers become aware of your brand and offerings.',
      channels: ['Social Media', 'Content Marketing', 'SEO', 'Paid Advertising'],
      metrics: ['Impressions', 'Reach', 'Website Traffic', 'Brand Searches'],
      nextBestActions: [
        'Targeted social media campaign based on interests',
        'Educational blog content addressing pain points',
        'Optimized landing pages for search intent'
      ]
    },
    consideration: {
      title: 'Consideration Stage',
      description: 'Prospects evaluate your solution against alternatives.',
      channels: ['Email', 'Retargeting', 'Webinars', 'Case Studies'],
      metrics: ['Email Open Rates', 'Content Downloads', 'Webinar Attendance', 'Return Visits'],
      nextBestActions: [
        'Personalized email sequence based on browsing behavior',
        'Comparison guides highlighting your advantages',
        'Customer testimonial videos for social proof'
      ]
    },
    decision: {
      title: 'Decision Stage',
      description: 'Prospects are ready to make a purchase decision.',
      channels: ['Sales Calls', 'Demos', 'Free Trials', 'Consultations'],
      metrics: ['Demo Requests', 'Trial Sign-ups', 'Quote Requests', 'Cart Additions'],
      nextBestActions: [
        'Limited-time offer based on viewed products',
        'Personalized demo focusing on specific use cases',
        'Risk-reduction messaging addressing objections'
      ]
    },
    purchase: {
      title: 'Purchase Stage',
      description: 'Customers complete the transaction and become paying customers.',
      channels: ['Checkout Process', 'Payment Gateways', 'Sales Team', 'Email'],
      metrics: ['Conversion Rate', 'Average Order Value', 'Checkout Abandonment', 'Payment Success'],
      nextBestActions: [
        'Streamlined checkout process with saved information',
        'Relevant upsell recommendations',
        'Clear confirmation and next steps communication'
      ]
    },
    'post-purchase': {
      title: 'Post-Purchase Stage',
      description: 'New customers begin using your product or service.',
      channels: ['Email', 'In-app Messages', 'Customer Support', 'Knowledge Base'],
      metrics: ['Customer Satisfaction', 'Support Tickets', 'Product Usage', 'Repeat Purchases'],
      nextBestActions: [
        'Personalized onboarding sequence based on purchase',
        'Educational content for maximizing value',
        'Feedback request at optimal timing'
      ]
    }
  };

  const handleStageClick = (stageId) => {
    setActiveStage(stageId);
  };

  const getColorClass = (color) => {
    const colorMap = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      green: 'bg-green-500 hover:bg-green-600',
      yellow: 'bg-yellow-500 hover:bg-yellow-600',
      red: 'bg-red-500 hover:bg-red-600'
    };
    return colorMap[color] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getColorClassLight = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  const getStageColor = (stageId) => {
    const stage = journeyStages[activeJourney].find(s => s.id === stageId);
    return stage ? stage.color : 'gray';
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4">
        <h3 className="text-xl font-bold text-white">Predictive Customer Journey Orchestration</h3>
      </div>
      
      <div className="p-6">
        <motion.div
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          variants={fadeIn}
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Journey Type</label>
            <div className="flex flex-wrap gap-2">
              {journeyTypes.map(journey => (
                <button
                  key={journey.id}
                  onClick={() => setActiveJourney(journey.id)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    activeJourney === journey.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {journey.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <div className="relative">
              {/* Journey Path Visualization */}
              <div className="flex justify-between items-center mb-8 relative">
                {/* Connecting Line */}
                <div className="absolute h-1 bg-gray-200 left-0 right-0 top-1/2 transform -translate-y-1/2 z-0"></div>
                
                {/* Journey Stages */}
                {journeyStages[activeJourney].map((stage, index) => (
                  <div key={stage.id} className="relative z-10 flex flex-col items-center">
                    <button
                      onClick={() => handleStageClick(stage.id)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all transform ${
                        activeStage === stage.id ? 'scale-110 ring-4 ring-opacity-50' : ''
                      } ${getColorClass(stage.color)} ${activeStage === stage.id ? `ring-${stage.color}-300` : ''}`}
                    >
                      {index + 1}
                    </button>
                    <span className="mt-2 text-sm font-medium text-gray-700">{stage.label}</span>
                  </div>
                ))}
              </div>
              
              {/* Stage Details */}
              {activeStage && stageContent[activeStage] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gray-50 rounded-lg p-6"
                >
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{stageContent[activeStage].title}</h4>
                  <p className="text-gray-600 mb-4">{stageContent[activeStage].description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Key Channels</h5>
                      <div className="flex flex-wrap gap-2">
                        {stageContent[activeStage].channels.map(channel => (
                          <span key={channel} className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClassLight(getStageColor(activeStage))}`}>
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Key Metrics</h5>
                      <div className="flex flex-wrap gap-2">
                        {stageContent[activeStage].metrics.map(metric => (
                          <span key={metric} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">AI-Recommended Next Best Actions</h5>
                    <ul className="space-y-2">
                      {stageContent[activeStage].nextBestActions.map((action, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                          </svg>
                          <span className="text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                      Implement Actions
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Journey Analytics</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium text-gray-900">68%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Avg. Time to Conversion</span>
                    <span className="text-sm font-medium text-gray-900">12 days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Drop-off Rate</span>
                    <span className="text-sm font-medium text-gray-900">24%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Link href="/features/predictive-journey/analytics">
                  <a className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors flex items-center">
                    View detailed analytics
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </a>
                </Link>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Audience Segments</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div>
                    <h5 className="font-medium text-gray-900">New Visitors</h5>
                    <p className="text-sm text-gray-600">First-time website visitors</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    42% of users
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div>
                    <h5 className="font-medium text-gray-900">Considering</h5>
                    <p className="text-sm text-gray-600">Viewed multiple pages, no purchase</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    28% of users
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div>
                    <h5 className="font-medium text-gray-900">Ready to Buy</h5>
                    <p className="text-sm text-gray-600">Added to cart, high intent signals</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    15% of users
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <Link href="/features/predictive-journey/segments">
                  <a className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors flex items-center">
                    Manage segments
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JourneyVisualizer;
