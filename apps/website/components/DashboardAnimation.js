import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';

const DashboardAnimation = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [animationStep, setAnimationStep] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  useEffect(() => {
    if (inView) {
      setIsLoaded(true);
      const timer = setTimeout(() => {
        setAnimationStep(1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [inView]);

  useEffect(() => {
    if (animationStep > 0 && animationStep < 5) {
      const timer = setTimeout(() => {
        setAnimationStep(animationStep + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    if (animationStep === 5) {
      const timer = setTimeout(() => {
        setAnimationStep(1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [animationStep]);

  const tabs = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'content', label: 'Content' },
    { id: 'audience', label: 'Audience' },
    { id: 'settings', label: 'Settings' }
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

  const chartVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, delay: 0.3 }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  const getStepContent = () => {
    switch(animationStep) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 max-w-md">
              <div className="flex items-start">
                <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-100 max-w-md">
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
                      <span>85% likely to purchase Premium Plan</span>
                    </li>
                    <li className="text-sm text-gray-600 flex items-center">
                      <svg className="w-4 h-4 text-teal-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>62% likely to add Product X to cart</span>
                    </li>
                  </ul>
                  <div className="mt-3 flex space-x-2">
                    <button className="px-3 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 transition-colors">
                      Take Action
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 max-w-md">
              <div className="flex items-start">
                <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-gray-900">Content Recommendations</h5>
                  <p className="text-sm text-gray-600">Based on your content performance, we recommend creating more product tutorials with these specific themes:</p>
                  <ul className="mt-2 space-y-1">
                    <li className="text-sm text-gray-600 flex items-center">
                      <svg className="w-4 h-4 text-purple-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Advanced feature walkthroughs</span>
                    </li>
                  </ul>
                  <div className="mt-3 flex space-x-2">
                    <button className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors">
                      Generate Content
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-red-50 rounded-lg p-4 border border-red-100 max-w-md">
              <div className="flex items-start">
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-gray-900">Budget Recommendations</h5>
                  <p className="text-sm text-gray-600">Based on attribution data, we recommend the following budget adjustments:</p>
                  <ul className="mt-2 space-y-1">
                    <li className="text-sm text-gray-600 flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Increase Social Media budget by 15%</span>
                    </li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-2">Projected ROI increase: 18%</p>
                  <div className="mt-3 flex space-x-2">
                    <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors">
                      Apply Recommendations
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100 max-w-md">
              <div className="flex items-start">
                <div className="p-2 bg-cyan-100 rounded-full text-cyan-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-gray-900">Personalization Impact</h5>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-white p-2 rounded-lg">
                      <h6 className="text-xs text-gray-500 mb-1">Conversion Rate</h6>
                      <div className="flex items-end">
                        <p className="text-sm font-bold text-gray-900">+142%</p>
                        <p className="text-xs text-green-600 ml-1">↑</p>
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg">
                      <h6 className="text-xs text-gray-500 mb-1">Satisfaction</h6>
                      <div className="flex items-end">
                        <p className="text-sm font-bold text-gray-900">8.7/10</p>
                        <p className="text-xs text-green-600 ml-1">↑</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button className="px-3 py-1 bg-cyan-600 text-white text-xs rounded hover:bg-cyan-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={ref} className="relative bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h3 className="text-xl font-bold text-white">ReachSpark Dashboard</h3>
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

      <div className="p-6 h-[500px] relative">
        <motion.div
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <motion.div variants={itemVariants} className="bg-white rounded-lg border border-gray-200 p-4">
            <h5 className="text-xs text-gray-500 mb-1">Total Campaigns</h5>
            <p className="text-2xl font-bold text-gray-900">24</p>
            <p className="text-xs text-green-600">↑ 4 from last month</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-lg border border-gray-200 p-4">
            <h5 className="text-xs text-gray-500 mb-1">Engagement Rate</h5>
            <p className="text-2xl font-bold text-gray-900">8.2%</p>
            <p className="text-xs text-green-600">↑ 1.5% from avg.</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white rounded-lg border border-gray-200 p-4">
            <h5 className="text-xs text-gray-500 mb-1">Conversion Rate</h5>
            <p className="text-2xl font-bold text-gray-900">3.8%</p>
            <p className="text-xs text-green-600">↑ 0.7% from avg.</p>
          </motion.div>
        </motion.div>
        
        <motion.div
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          variants={chartVariants}
          className="bg-white rounded-lg border border-gray-200 p-4 mb-6 h-64 relative"
        >
          <h5 className="text-sm font-medium text-gray-700 mb-4">Performance Overview</h5>
          <div className="absolute inset-0 flex items-center justify-center mt-10">
            <div className="w-full max-w-3xl h-40 flex items-end space-x-4 justify-around px-10">
              <motion.div 
                className="w-12 bg-indigo-500 rounded-t-lg" 
                initial={{ height: 0 }}
                animate={{ height: '60%' }}
                transition={{ duration: 1, delay: 0.5 }}
              ></motion.div>
              <motion.div 
                className="w-12 bg-indigo-500 rounded-t-lg" 
                initial={{ height: 0 }}
                animate={{ height: '75%' }}
                transition={{ duration: 1, delay: 0.6 }}
              ></motion.div>
              <motion.div 
                className="w-12 bg-indigo-500 rounded-t-lg" 
                initial={{ height: 0 }}
                animate={{ height: '45%' }}
                transition={{ duration: 1, delay: 0.7 }}
              ></motion.div>
              <motion.div 
                className="w-12 bg-indigo-500 rounded-t-lg" 
                initial={{ height: 0 }}
                animate={{ height: '90%' }}
                transition={{ duration: 1, delay: 0.8 }}
              ></motion.div>
              <motion.div 
                className="w-12 bg-indigo-500 rounded-t-lg" 
                initial={{ height: 0 }}
                animate={{ height: '65%' }}
                transition={{ duration: 1, delay: 0.9 }}
              ></motion.div>
              <motion.div 
                className="w-12 bg-indigo-500 rounded-t-lg" 
                initial={{ height: 0 }}
                animate={{ height: '80%' }}
                transition={{ duration: 1, delay: 1 }}
              ></motion.div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial="hidden"
          animate={isLoaded ? "pulse" : "hidden"}
          variants={pulseVariants}
          className="absolute top-4 right-4 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </motion.div>
        
        <AnimatePresence>
          {getStepContent()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardAnimation;
