import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';

const ResponsiveTestingPage = () => {
  const [deviceType, setDeviceType] = useState('desktop');
  const [browserType, setBrowserType] = useState('chrome');
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  useEffect(() => {
    // Detect device type on client side
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setDeviceType('mobile');
      } else if (window.innerWidth < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Detect browser type
    const detectBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.indexOf('chrome') > -1) {
        setBrowserType('chrome');
      } else if (userAgent.indexOf('firefox') > -1) {
        setBrowserType('firefox');
      } else if (userAgent.indexOf('safari') > -1) {
        setBrowserType('safari');
      } else if (userAgent.indexOf('edge') > -1 || userAgent.indexOf('edg') > -1) {
        setBrowserType('edge');
      } else {
        setBrowserType('other');
      }
    };

    if (typeof window !== 'undefined') {
      handleResize();
      detectBrowser();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

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

  return (
    <div ref={ref} className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-extrabold text-gray-900"
          >
            Responsive Testing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto"
          >
            This page helps verify that all components and animations work correctly across different devices and browsers.
          </motion.p>
        </div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <h2 className="text-xl font-bold text-white">Device Detection</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">Your current device type:</p>
              <div className="flex items-center justify-center p-4 bg-indigo-50 rounded-lg">
                <span className="text-2xl font-bold text-indigo-600">{deviceType.toUpperCase()}</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg text-center ${deviceType === 'mobile' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                  </svg>
                  <span>Mobile</span>
                </div>
                <div className={`p-4 rounded-lg text-center ${deviceType === 'tablet' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm4 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                  </svg>
                  <span>Tablet</span>
                </div>
                <div className={`p-4 rounded-lg text-center ${deviceType === 'desktop' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd"></path>
                  </svg>
                  <span>Desktop</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
              <h2 className="text-xl font-bold text-white">Browser Detection</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">Your current browser:</p>
              <div className="flex items-center justify-center p-4 bg-purple-50 rounded-lg">
                <span className="text-2xl font-bold text-purple-600">{browserType.toUpperCase()}</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg text-center ${browserType === 'chrome' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.003h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.366zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728z" />
                  </svg>
                  <span>Chrome</span>
                </div>
                <div className={`p-4 rounded-lg text-center ${browserType === 'firefox' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    <path d="M12 5a7 7 0 100 14 7 7 0 000-14zm0 12a5 5 0 110-10 5 5 0 010 10z" />
                  </svg>
                  <span>Firefox</span>
                </div>
                <div className={`p-4 rounded-lg text-center ${browserType === 'safari' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    <path d="M12 5a7 7 0 100 14 7 7 0 000-14zm0 12a5 5 0 110-10 5 5 0 010 10z" />
                  </svg>
                  <span>Safari</span>
                </div>
                <div className={`p-4 rounded-lg text-center ${browserType === 'edge' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    <path d="M12 5a7 7 0 100 14 7 7 0 000-14zm0 12a5 5 0 110-10 5 5 0 010 10z" />
                  </svg>
                  <span>Edge</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
              <h2 className="text-xl font-bold text-white">Animation Test</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">Test animations and transitions:</p>
              
              <div className="space-y-4">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-4 bg-teal-50 rounded-lg cursor-pointer"
                >
                  <p className="text-center text-teal-700">Hover & Tap Animation</p>
                </motion.div>
                
                <motion.div 
                  animate={{ 
                    x: [0, 10, -10, 10, 0],
                    transition: { repeat: Infinity, duration: 2 }
                  }}
                  className="p-4 bg-teal-50 rounded-lg"
                >
                  <p className="text-center text-teal-700">Continuous Animation</p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.5 }}
                  className="p-4 bg-teal-50 rounded-lg"
                >
                  <p className="text-center text-teal-700">Height Animation</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden mb-16"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <h2 className="text-xl font-bold text-white">Responsive Layout Test</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">This grid layout should adapt to different screen sizes:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div key={item} className="bg-gray-100 p-4 rounded-lg">
                  <div className="h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-md flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600">{item}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 text-center">Grid Item {item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6">
            <h2 className="text-xl font-bold text-white">Touch Interaction Test</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">Test touch interactions (especially important for mobile devices):</p>
            
            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-red-700 mb-2">Swipe Test</h3>
                <div className="h-32 bg-white rounded-lg border-2 border-dashed border-red-200 flex items-center justify-center">
                  <p className="text-gray-500">Swipe left or right here</p>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-red-700 mb-2">Pinch Zoom Test</h3>
                <div className="h-32 bg-white rounded-lg border-2 border-dashed border-red-200 flex items-center justify-center">
                  <p className="text-gray-500">Pinch to zoom here</p>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-red-700 mb-2">Tap Accuracy Test</h3>
                <div className="grid grid-cols-3 gap-2 h-32">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                    <div key={item} className="bg-white rounded-lg border-2 border-dashed border-red-200 flex items-center justify-center">
                      <span className="text-gray-500">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Testing Complete?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/" className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                Return to Homepage
              </Link>
              <Link href="/features" className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow hover:shadow-md transition-all duration-300">
                View Features
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTestingPage;
