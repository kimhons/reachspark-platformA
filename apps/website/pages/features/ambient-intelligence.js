/**
 * AmbientIntelligenceFeature.js
 * 
 * This component serves as the detailed feature page for Ambient Intelligence,
 * showcasing its capabilities, benefits, and use cases.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { SparklesIcon, LightBulbIcon, CogIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const AmbientIntelligenceFeature = () => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  // Use cases
  const useCases = [
    {
      id: 'contextualRecommendations',
      title: 'Contextual Recommendations',
      description: 'Deliver personalized content and product recommendations based on real-time context and behavior.',
      icon: <SparklesIcon className="h-6 w-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      id: 'adaptiveMessaging',
      title: 'Adaptive Messaging',
      description: 'Automatically adjust messaging tone, content, and timing based on customer mood and receptivity.',
      icon: <LightBulbIcon className="h-6 w-6" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      id: 'proactiveEngagement',
      title: 'Proactive Engagement',
      description: 'Anticipate customer needs and initiate engagement at the optimal moment with the right message.',
      icon: <CogIcon className="h-6 w-6" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      id: 'continuousOptimization',
      title: 'Continuous Optimization',
      description: 'Leverage ambient data to continuously refine and optimize marketing strategies in real-time.',
      icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    }
  ];

  // Benefits
  const benefits = [
    {
      id: 1,
      title: '53% Higher Engagement',
      description: 'Ambient intelligence creates more relevant interactions that significantly boost customer engagement.',
    },
    {
      id: 2,
      title: '41% Increase in Customer Satisfaction',
      description: 'Customers appreciate experiences that adapt to their needs and preferences in real-time.',
    },
    {
      id: 3,
      title: 'Seamless Experiences',
      description: 'Create cohesive customer journeys that adapt naturally across devices and channels.',
    },
    {
      id: 4,
      title: 'Ethical AI',
      description: 'Our ambient intelligence respects privacy and operates with transparent, ethical AI principles.',
    }
  ];

  return (
    <div ref={ref} className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="absolute inset-y-0 h-full w-full" aria-hidden="true">
          <div className="relative h-full">
            <svg
              className="absolute right-full transform translate-y-1/3 translate-x-1/4 md:translate-y-1/2 sm:translate-x-1/2 lg:translate-x-full"
              width="404"
              height="784"
              fill="none"
              viewBox="0 0 404 784"
              opacity="0.25"
            >
              <defs>
                <pattern
                  id="e229dbec-10e9-49ee-8ec3-0286ca089edf"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="4" height="4" className="text-white" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="784" fill="url(#e229dbec-10e9-49ee-8ec3-0286ca089edf)" />
            </svg>
          </div>
        </div>

        <div className="relative pt-12 pb-16 sm:pb-24">
          <div className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">Ambient Intelligence</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-purple-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  Create marketing experiences that intuitively adapt to customer context, behavior, and needs in real-time.
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                  <div className="rounded-md shadow">
                    <Link href="/signup" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                      Start Free Trial
                    </Link>
                  </div>
                  <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                    <Link href="/features" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-800 bg-opacity-60 hover:bg-opacity-70 md:py-4 md:text-lg md:px-10">
                      Explore Features
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-base font-semibold text-purple-600 tracking-wide uppercase">Feature Overview</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Marketing That Understands Context
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              ReachSpark's Ambient Intelligence creates intuitive marketing experiences that adapt to customer context and behavior in real-time.
            </p>
          </motion.div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="h-64 bg-purple-100 rounded-lg overflow-hidden">
                  <img
                    src="/images/features/ambient-intelligence-dashboard.jpg"
                    alt="Ambient Intelligence Dashboard"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative mt-8">
                  <h3 className="text-2xl font-bold text-gray-900">Contextual Understanding</h3>
                  <p className="mt-3 text-lg text-gray-500">
                    Our AI analyzes multiple data points to understand customer context and deliver perfectly timed, relevant experiences.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative"
              >
                <div className="h-64 bg-purple-100 rounded-lg overflow-hidden">
                  <img
                    src="/images/features/adaptive-experiences.jpg"
                    alt="Adaptive Experiences"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative mt-8">
                  <h3 className="text-2xl font-bold text-gray-900">Adaptive Experiences</h3>
                  <p className="mt-3 text-lg text-gray-500">
                    Create experiences that seamlessly adapt to customer needs, preferences, and behaviors across all touchpoints.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-base font-semibold text-purple-600 tracking-wide uppercase">Use Cases</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Intelligent Experiences for Every Customer
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              From contextual recommendations to proactive engagement, our ambient intelligence creates more meaningful customer interactions.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-md ${useCase.bgColor} ${useCase.color}`}>
                      {useCase.icon}
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">{useCase.title}</h3>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">{useCase.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-base font-semibold text-purple-600 tracking-wide uppercase">Benefits</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Why Choose Ambient Intelligence
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Our ambient intelligence delivers measurable results that help you create more meaningful customer relationships.
            </p>
          </motion.div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-50 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-xl font-bold text-purple-600">{benefit.title}</h3>
                    <p className="mt-3 text-base text-gray-500">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div className="py-16 bg-gray-50 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="mt-10"
            >
              <div className="max-w-3xl mx-auto text-center text-2xl leading-9 font-medium text-gray-900">
                <p>
                  &ldquo;ReachSpark's ambient intelligence has transformed how we engage with customers. Our satisfaction scores have increased by 47%, and customers consistently tell us how much they appreciate the intuitive, personalized experiences.&rdquo;
                </p>
              </div>
              <footer className="mt-8">
                <div className="md:flex md:items-center md:justify-center">
                  <div className="md:flex-shrink-0">
                    <img
                      className="mx-auto h-10 w-10 rounded-full"
                      src="/images/testimonials/customer-experience-director.jpg"
                      alt=""
                    />
                  </div>
                  <div className="mt-3 text-center md:mt-0 md:ml-4 md:flex md:items-center">
                    <div className="text-base font-medium text-gray-900">Sarah Johnson</div>
                    <svg className="hidden md:block mx-1 h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 0h3L9 20H6l5-20z" />
                    </svg>
                    <div className="text-base font-medium text-gray-500">Customer Experience Director, NexGen Retail</div>
                  </div>
                </div>
              </footer>
            </motion.blockquote>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-purple-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready for intelligent marketing?</span>
            <span className="block">Start your free trial today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-purple-200">
            Experience the power of ambient intelligence with a 7-day free trial. No credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50 sm:w-auto"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AmbientIntelligenceFeature;
