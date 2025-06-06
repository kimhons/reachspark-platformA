import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';

const FeatureShowcase = () => {
  const [activeFeature, setActiveFeature] = useState('aiCopilot');
  const { ref: showcaseRef, inView: showcaseInView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  const features = [
    {
      id: 'aiCopilot',
      name: 'AI Marketing Copilot',
      description: 'Your autonomous AI assistant that proactively suggests improvements, generates content variations, and provides real-time coaching.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      link: '/features/ai-marketing-copilot'
    },
    {
      id: 'predictiveJourney',
      name: 'Predictive Customer Journey',
      description: 'Anticipate customer needs and automatically adjust campaigns based on real-time behavior and predicted next actions.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'from-green-500 to-teal-600',
      textColor: 'text-teal-600',
      bgColor: 'bg-teal-100',
      link: '/features/predictive-customer-journey'
    },
    {
      id: 'influencerMarketplace',
      name: 'Influencer Marketplace',
      description: 'Connect with relevant influencers, manage campaigns, and track performance all in one integrated platform.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-yellow-500 to-orange-600',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/features/influencer-marketplace'
    },
    {
      id: 'semanticContent',
      name: 'Semantic Content Intelligence',
      description: 'Analyze content performance, identify patterns, and automatically generate optimized content variations.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/features/semantic-content-intelligence'
    },
    {
      id: 'revenueAttribution',
      name: 'Revenue Attribution AI',
      description: 'Understand the true impact of your marketing efforts across multiple touchpoints and channels.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-red-500 to-pink-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-100',
      link: '/features/revenue-attribution-ai'
    },
    {
      id: 'omnichannelPersonalization',
      name: 'Omnichannel Personalization',
      description: 'Deliver consistent, personalized experiences across all customer touchpoints and channels.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      link: '/features/omnichannel-personalization'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const featureScreenVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section ref={showcaseRef} className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={showcaseInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-extrabold text-gray-900"
          >
            Revolutionary Features
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={showcaseInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto"
          >
            Discover the powerful capabilities that make ReachSpark the ultimate AI-powered marketing platform.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <motion.div
              initial="hidden"
              animate={showcaseInView ? "visible" : "hidden"}
              variants={containerVariants}
              className="space-y-4"
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.id}
                  variants={itemVariants}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                    activeFeature === feature.id
                      ? `${feature.bgColor} border-l-4 border-${feature.textColor.split('-')[1]}`
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveFeature(feature.id)}
                >
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg ${activeFeature === feature.id ? feature.textColor : 'text-gray-400'}`}>
                      {feature.icon}
                    </div>
                    <div className="ml-4">
                      <h3 className={`text-lg font-medium ${activeFeature === feature.id ? feature.textColor : 'text-gray-900'}`}>
                        {feature.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <motion.div
              key={activeFeature}
              initial="hidden"
              animate="visible"
              variants={featureScreenVariants}
              className="bg-white rounded-xl shadow-xl overflow-hidden h-full"
            >
              {activeFeature === 'aiCopilot' && (
                <div className="h-full">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                    <h3 className="text-xl font-bold text-white">AI Marketing Copilot</h3>
                  </div>
                  <div className="p-6 h-[500px] overflow-hidden">
                    <div className="flex space-x-4 mb-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">Campaign Performance</h4>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Autonomous Mode</span>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                              <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer" />
                              <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                          </div>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 mb-4">
                          <div className="flex items-start">
                            <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h5 className="text-sm font-medium text-gray-900">AI Suggestion</h5>
                              <p className="text-sm text-gray-600">Your email open rates are 15% below industry average. I recommend testing these 3 subject line variations.</p>
                              <div className="mt-2 flex space-x-2">
                                <button className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors">
                                  Apply All
                                </button>
                                <button className="px-2 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors">
                                  Review
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Content Generation</h5>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-indigo-600 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">75%</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-indigo-600 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">60%</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-indigo-600 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">85%</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Performance Insights</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Open Rate</span>
                            <span className="text-xs font-medium text-green-600">↑ 23%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Click Rate</span>
                            <span className="text-xs font-medium text-green-600">↑ 18%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Conversion</span>
                            <span className="text-xs font-medium text-red-600">↓ 5%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'predictiveJourney' && (
                <div className="h-full">
                  <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4">
                    <h3 className="text-xl font-bold text-white">Predictive Customer Journey</h3>
                  </div>
                  <div className="p-6 h-[500px] overflow-hidden">
                    <div className="flex flex-col h-full">
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">Customer Journey Map</h4>
                          <div className="flex space-x-2">
                            <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                              <option>High-Value Segment</option>
                              <option>New Customers</option>
                              <option>At-Risk Segment</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full max-w-3xl">
                            <div className="relative">
                              <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-teal-500 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                              
                              <div className="mt-6 flex justify-between relative">
                                <div className="flex flex-col items-center">
                                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="mt-2 text-center">
                                    <h6 className="text-sm font-medium text-gray-900">Awareness</h6>
                                    <p className="text-xs text-gray-500">Completed</p>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-center">
                                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="mt-2 text-center">
                                    <h6 className="text-sm font-medium text-gray-900">Consideration</h6>
                                    <p className="text-xs text-gray-500">Completed</p>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-center">
                                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white relative animate-pulse">
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="mt-2 text-center">
                                    <h6 className="text-sm font-medium text-gray-900">Purchase</h6>
                                    <p className="text-xs text-teal-600">Current Stage</p>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-center">
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="mt-2 text-center">
                                    <h6 className="text-sm font-medium text-gray-900">Retention</h6>
                                    <p className="text-xs text-gray-500">Upcoming</p>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-center">
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="mt-2 text-center">
                                    <h6 className="text-sm font-medium text-gray-900">Advocacy</h6>
                                    <p className="text-xs text-gray-500">Upcoming</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-12 bg-teal-50 rounded-lg p-4 border border-teal-100">
                              <div className="flex items-start">
                                <div className="p-2 bg-teal-100 rounded-full text-teal-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">Predicted Next Actions</h5>
                                  <ul className="mt-2 space-y-1">
                                    <li className="text-sm text-gray-600 flex items-center">
                                      <svg className="w-4 h-4 text-teal-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      <span>85% likely to purchase Premium Plan within 48 hours</span>
                                    </li>
                                    <li className="text-sm text-gray-600 flex items-center">
                                      <svg className="w-4 h-4 text-teal-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      <span>62% likely to add Product X to cart</span>
                                    </li>
                                    <li className="text-sm text-gray-600 flex items-center">
                                      <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      <span>28% risk of cart abandonment</span>
                                    </li>
                                  </ul>
                                  <div className="mt-3 flex space-x-2">
                                    <button className="px-3 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 transition-colors">
                                      Take Action
                                    </button>
                                    <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors">
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'influencerMarketplace' && (
                <div className="h-full">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-4">
                    <h3 className="text-xl font-bold text-white">Influencer Marketplace</h3>
                  </div>
                  <div className="p-6 h-[500px] overflow-hidden">
                    <div className="flex flex-col h-full">
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">Discover Influencers</h4>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Search influencers..."
                              className="text-sm border border-gray-300 rounded-md px-3 py-1 w-48"
                            />
                            <button className="bg-orange-600 text-white px-3 py-1 rounded-md text-sm hover:bg-orange-700 transition-colors">
                              Filter
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                          <div className="h-32 bg-orange-100"></div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900">@influencer1</h5>
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                Fashion
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              <span>125K followers</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="flex items-center text-yellow-500">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </div>
                              </div>
                              <button className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors">
                                Connect
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                          <div className="h-32 bg-orange-100"></div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900">@influencer2</h5>
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                Tech
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              <span>250K followers</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="flex items-center text-yellow-500">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </div>
                              </div>
                              <button className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors">
                                Connect
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                          <div className="h-32 bg-orange-100"></div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900">@influencer3</h5>
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                Fitness
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              <span>180K followers</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="flex items-center text-yellow-500">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </div>
                              </div>
                              <button className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors">
                                Connect
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Campaign Performance</h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <h6 className="text-xs text-gray-500 mb-1">Engagement Rate</h6>
                            <p className="text-lg font-bold text-gray-900">8.2%</p>
                            <p className="text-xs text-green-600">↑ 1.5% from avg.</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <h6 className="text-xs text-gray-500 mb-1">Conversion Rate</h6>
                            <p className="text-lg font-bold text-gray-900">3.8%</p>
                            <p className="text-xs text-green-600">↑ 0.7% from avg.</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <h6 className="text-xs text-gray-500 mb-1">ROI</h6>
                            <p className="text-lg font-bold text-gray-900">285%</p>
                            <p className="text-xs text-green-600">↑ 45% from avg.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'semanticContent' && (
                <div className="h-full">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                    <h3 className="text-xl font-bold text-white">Semantic Content Intelligence</h3>
                  </div>
                  <div className="p-6 h-[500px] overflow-hidden">
                    <div className="flex flex-col h-full">
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">Content Performance Analysis</h4>
                          <div className="flex space-x-2">
                            <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                              <option>Last 30 Days</option>
                              <option>Last Quarter</option>
                              <option>Last Year</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Top Performing Content Themes</h5>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600">Product Tutorials</span>
                                <span className="text-xs font-medium text-gray-900">92%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-purple-600 rounded-full" style={{ width: '92%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600">Customer Success Stories</span>
                                <span className="text-xs font-medium text-gray-900">78%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-purple-600 rounded-full" style={{ width: '78%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600">Industry Insights</span>
                                <span className="text-xs font-medium text-gray-900">65%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-purple-600 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600">How-to Guides</span>
                                <span className="text-xs font-medium text-gray-900">58%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-purple-600 rounded-full" style={{ width: '58%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Semantic Analysis</h5>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Product Features
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Customer Benefits
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              ROI
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Implementation
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Case Studies
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Technical Support
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Industry Trends
                            </span>
                          </div>
                          
                          <div className="mt-4">
                            <h6 className="text-xs font-medium text-gray-700 mb-2">Sentiment Analysis</h6>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '70%' }}></div>
                              </div>
                              <span className="ml-2 text-xs text-gray-600">70% Positive</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 mb-6">
                        <div className="flex items-start">
                          <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h5 className="text-sm font-medium text-gray-900">AI-Generated Content Recommendations</h5>
                            <p className="text-sm text-gray-600 mt-1">Based on your content performance, we recommend creating more product tutorials with these specific themes:</p>
                            <ul className="mt-2 space-y-1">
                              <li className="text-sm text-gray-600 flex items-center">
                                <svg className="w-4 h-4 text-purple-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Advanced feature walkthroughs with ROI calculations</span>
                              </li>
                              <li className="text-sm text-gray-600 flex items-center">
                                <svg className="w-4 h-4 text-purple-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Integration guides with customer success stories</span>
                              </li>
                              <li className="text-sm text-gray-600 flex items-center">
                                <svg className="w-4 h-4 text-purple-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Industry-specific implementation examples</span>
                              </li>
                            </ul>
                            <div className="mt-3 flex space-x-2">
                              <button className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors">
                                Generate Content
                              </button>
                              <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors">
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Content Optimization</h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                              <span className="text-sm text-gray-600">Blog Post: "10 Ways to Improve..."</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-2">Optimization Score:</span>
                              <span className="text-xs font-medium text-gray-900">78/100</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                              <span className="text-sm text-gray-600">Email: "New Feature Announcement"</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-2">Optimization Score:</span>
                              <span className="text-xs font-medium text-gray-900">92/100</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                              <span className="text-sm text-gray-600">Landing Page: "Enterprise Solutions"</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-2">Optimization Score:</span>
                              <span className="text-xs font-medium text-gray-900">65/100</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors">
                            Optimize All Content
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'revenueAttribution' && (
                <div className="h-full">
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 p-4">
                    <h3 className="text-xl font-bold text-white">Revenue Attribution AI</h3>
                  </div>
                  <div className="p-6 h-[500px] overflow-hidden">
                    <div className="flex flex-col h-full">
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">Attribution Dashboard</h4>
                          <div className="flex space-x-2">
                            <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                              <option>Last 30 Days</option>
                              <option>Last Quarter</option>
                              <option>Last Year</option>
                            </select>
                            <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                              <option>Algorithmic Model</option>
                              <option>First Touch</option>
                              <option>Last Touch</option>
                              <option>Linear</option>
                              <option>Time Decay</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h5 className="text-xs text-gray-500 mb-1">Total Revenue</h5>
                          <p className="text-2xl font-bold text-gray-900">$128,450</p>
                          <p className="text-xs text-green-600">↑ 12% from previous period</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h5 className="text-xs text-gray-500 mb-1">Marketing ROI</h5>
                          <p className="text-2xl font-bold text-gray-900">342%</p>
                          <p className="text-xs text-green-600">↑ 28% from previous period</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h5 className="text-xs text-gray-500 mb-1">Avg. Customer Value</h5>
                          <p className="text-2xl font-bold text-gray-900">$1,250</p>
                          <p className="text-xs text-green-600">↑ 5% from previous period</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Channel Attribution</h5>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">Paid Search</span>
                              <span className="text-xs font-medium text-gray-900">$42,380 (33%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-red-500 rounded-full" style={{ width: '33%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">Social Media</span>
                              <span className="text-xs font-medium text-gray-900">$28,260 (22%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-red-500 rounded-full" style={{ width: '22%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">Email Marketing</span>
                              <span className="text-xs font-medium text-gray-900">$25,690 (20%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-red-500 rounded-full" style={{ width: '20%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">Organic Search</span>
                              <span className="text-xs font-medium text-gray-900">$19,270 (15%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-red-500 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">Direct</span>
                              <span className="text-xs font-medium text-gray-900">$12,850 (10%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-red-500 rounded-full" style={{ width: '10%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                        <div className="flex items-start">
                          <div className="p-2 bg-red-100 rounded-full text-red-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h5 className="text-sm font-medium text-gray-900">AI Budget Recommendations</h5>
                            <p className="text-sm text-gray-600 mt-1">Based on attribution data, we recommend the following budget adjustments:</p>
                            <ul className="mt-2 space-y-1">
                              <li className="text-sm text-gray-600 flex items-center">
                                <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Increase Social Media budget by 15%</span>
                              </li>
                              <li className="text-sm text-gray-600 flex items-center">
                                <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Maintain Email Marketing budget</span>
                              </li>
                              <li className="text-sm text-gray-600 flex items-center">
                                <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>Decrease Paid Search budget by 10%</span>
                              </li>
                            </ul>
                            <p className="text-sm text-gray-600 mt-2">Projected ROI increase: 18%</p>
                            <div className="mt-3 flex space-x-2">
                              <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors">
                                Apply Recommendations
                              </button>
                              <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors">
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'omnichannelPersonalization' && (
                <div className="h-full">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-4">
                    <h3 className="text-xl font-bold text-white">Omnichannel Personalization</h3>
                  </div>
                  <div className="p-6 h-[500px] overflow-hidden">
                    <div className="flex flex-col h-full">
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">Customer Experience Dashboard</h4>
                          <div className="flex space-x-2">
                            <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                              <option>All Segments</option>
                              <option>High-Value Customers</option>
                              <option>New Customers</option>
                              <option>At-Risk Customers</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Channel Performance</h5>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600">Website</span>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-gray-900 mr-2">85%</span>
                                  <span className="text-xs text-green-600">↑ 12%</span>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-cyan-500 rounded-full" style={{ width: '85%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600">Mobile App</span>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-gray-900 mr-2">78%</span>
                                  <span className="text-xs text-green-600">↑ 8%</span>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-cyan-500 rounded-full" style={{ width: '78%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600">Email</span>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-gray-900 mr-2">72%</span>
                                  <span className="text-xs text-green-600">↑ 5%</span>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-cyan-500 rounded-full" style={{ width: '72%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600">SMS</span>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-gray-900 mr-2">65%</span>
                                  <span className="text-xs text-green-600">↑ 3%</span>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-cyan-500 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Personalization Impact</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-cyan-50 p-3 rounded-lg">
                              <h6 className="text-xs text-gray-500 mb-1">Conversion Rate</h6>
                              <div className="flex items-end">
                                <p className="text-lg font-bold text-gray-900">+142%</p>
                                <p className="text-xs text-green-600 ml-2 mb-1">vs. non-personalized</p>
                              </div>
                            </div>
                            <div className="bg-cyan-50 p-3 rounded-lg">
                              <h6 className="text-xs text-gray-500 mb-1">Avg. Order Value</h6>
                              <div className="flex items-end">
                                <p className="text-lg font-bold text-gray-900">+28%</p>
                                <p className="text-xs text-green-600 ml-2 mb-1">vs. non-personalized</p>
                              </div>
                            </div>
                            <div className="bg-cyan-50 p-3 rounded-lg">
                              <h6 className="text-xs text-gray-500 mb-1">Customer Satisfaction</h6>
                              <div className="flex items-end">
                                <p className="text-lg font-bold text-gray-900">8.7/10</p>
                                <p className="text-xs text-green-600 ml-2 mb-1">+1.2 points</p>
                              </div>
                            </div>
                            <div className="bg-cyan-50 p-3 rounded-lg">
                              <h6 className="text-xs text-gray-500 mb-1">Retention Rate</h6>
                              <div className="flex items-end">
                                <p className="text-lg font-bold text-gray-900">+35%</p>
                                <p className="text-xs text-green-600 ml-2 mb-1">vs. non-personalized</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100 mb-6">
                        <div className="flex items-start">
                          <div className="p-2 bg-cyan-100 rounded-full text-cyan-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h5 className="text-sm font-medium text-gray-900">Active Personalization Campaigns</h5>
                            <div className="mt-2 space-y-2">
                              <div className="bg-white p-2 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center">
                                  <h6 className="text-sm font-medium text-gray-900">Welcome Series</h6>
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    Active
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">Personalized onboarding for new customers</p>
                                <div className="mt-1 flex items-center">
                                  <span className="text-xs text-gray-500 mr-2">Performance:</span>
                                  <span className="text-xs font-medium text-green-600">32% conversion rate</span>
                                </div>
                              </div>
                              
                              <div className="bg-white p-2 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center">
                                  <h6 className="text-sm font-medium text-gray-900">Abandoned Cart Recovery</h6>
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    Active
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">Personalized offers based on cart items and customer value</p>
                                <div className="mt-1 flex items-center">
                                  <span className="text-xs text-gray-500 mr-2">Performance:</span>
                                  <span className="text-xs font-medium text-green-600">28% recovery rate</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex space-x-2">
                              <button className="px-3 py-1 bg-cyan-600 text-white text-xs rounded hover:bg-cyan-700 transition-colors">
                                View All Campaigns
                              </button>
                              <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors">
                                Create New
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Customer Profile Sample</h5>
                        <div className="flex items-start">
                          <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h6 className="text-sm font-medium text-gray-900">Sarah Johnson</h6>
                            <p className="text-xs text-gray-500">High-Value Customer</p>
                            
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-gray-500">Interests:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded text-xs">
                                    Fitness
                                  </span>
                                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded text-xs">
                                    Nutrition
                                  </span>
                                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded text-xs">
                                    Outdoor
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Channel Preferences:</p>
                                <div className="flex items-center mt-1">
                                  <span className="text-xs text-gray-600 mr-1">Email:</span>
                                  <div className="w-12 h-1.5 bg-gray-200 rounded-full">
                                    <div className="h-1.5 bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs text-gray-600 mr-1">Mobile:</span>
                                  <div className="w-12 h-1.5 bg-gray-200 rounded-full">
                                    <div className="h-1.5 bg-yellow-500 rounded-full" style={{ width: '60%' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Next Best Actions:</p>
                              <ul className="mt-1 space-y-1">
                                <li className="text-xs text-gray-600 flex items-center">
                                  <svg className="w-3 h-3 text-cyan-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>Send personalized workout plan email</span>
                                </li>
                                <li className="text-xs text-gray-600 flex items-center">
                                  <svg className="w-3 h-3 text-cyan-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>Recommend nutrition supplements</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
