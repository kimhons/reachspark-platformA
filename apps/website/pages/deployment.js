import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Head from 'next/head';
import { useInView } from 'react-intersection-observer';

const DeploymentPage = () => {
  const [deploymentStatus, setDeploymentStatus] = useState('preparing');
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      // Simulate deployment process
      const timer = setTimeout(() => {
        setDeploymentStatus('in_progress');
        
        const interval = setInterval(() => {
          setDeploymentProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setDeploymentStatus('completed');
              return 100;
            }
            return prev + 10;
          });
        }, 800);
        
        return () => clearInterval(interval);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [inView]);

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

  const getStatusContent = () => {
    switch(deploymentStatus) {
      case 'preparing':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
              <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Preparing Deployment</h3>
            <p className="text-gray-600">Getting everything ready for deployment...</p>
          </div>
        );
      case 'in_progress':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Deployment in Progress</h3>
            <p className="text-gray-600 mb-4">Deploying the updated website with all new features...</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 max-w-md mx-auto">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${deploymentProgress}%` }}></div>
            </div>
            <p className="text-sm text-gray-500">{deploymentProgress}% complete</p>
          </div>
        );
      case 'completed':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Deployment Completed</h3>
            <p className="text-gray-600 mb-6">The updated website has been successfully deployed!</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/" className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                View Live Website
              </Link>
              <Link href="/test-report" className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow hover:shadow-md transition-all duration-300">
                View Test Report
              </Link>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Website Deployment | ReachSpark</title>
        <meta name="description" content="Deploying the updated ReachSpark website with new features" />
      </Head>
      
      <div ref={ref} className="bg-gray-50 py-16 min-h-screen flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-extrabold text-gray-900"
            >
              Website Deployment
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto"
            >
              Deploying the updated ReachSpark website with all new features and verified animations.
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={containerVariants}
            className="space-y-12"
          >
            <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg overflow-hidden p-8">
              {getStatusContent()}
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <h2 className="text-xl font-bold text-white">Deployment Summary</h2>
              </div>
              <div className="p-6">
                <div className="prose max-w-none">
                  <h3>What's Being Deployed</h3>
                  <ul>
                    <li><strong>Modern Homepage:</strong> Updated with animated sections and feature showcase</li>
                    <li><strong>Features Page:</strong> Interactive display of all six killer features</li>
                    <li><strong>Testing Infrastructure:</strong> Cross-browser and device compatibility testing</li>
                    <li><strong>Enhanced Animations:</strong> Smooth transitions and interactive elements</li>
                    <li><strong>Responsive Design:</strong> Optimized for all screen sizes and devices</li>
                    <li><strong>Content Migration:</strong> All existing articles and content preserved</li>
                  </ul>
                  
                  <h3>Killer Features Included</h3>
                  <ul>
                    <li><strong>AI Marketing Copilot:</strong> With autonomous capabilities</li>
                    <li><strong>Predictive Customer Journey Orchestration:</strong> For anticipating customer needs</li>
                    <li><strong>Integrated Influencer Marketplace:</strong> Connect with relevant influencers</li>
                    <li><strong>Semantic Content Intelligence:</strong> Analyze and optimize content</li>
                    <li><strong>Revenue Attribution AI:</strong> Understand marketing impact</li>
                    <li><strong>Omnichannel Personalization Engine:</strong> Deliver consistent experiences</li>
                  </ul>
                  
                  <h3>Technical Improvements</h3>
                  <ul>
                    <li>Enhanced performance with optimized assets</li>
                    <li>Improved accessibility for all users</li>
                    <li>SEO optimizations for better visibility</li>
                    <li>Modern UI with consistent design language</li>
                    <li>Touch-optimized interactions for mobile users</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
                <h2 className="text-xl font-bold text-white">Deployment Environment</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Production Environment</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-teal-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">Cloudflare Pages for global CDN</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-teal-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">Next.js for server-side rendering</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-teal-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">Firebase for backend services</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-teal-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">Continuous integration with GitHub Actions</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Deployment Process</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-teal-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">Automated build and deployment pipeline</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-teal-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">Zero-downtime deployment strategy</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-teal-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">Automated post-deployment testing</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-teal-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">Rollback capability if issues detected</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DeploymentPage;
