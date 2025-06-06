/**
 * OutcomeBasedInterfaceFeature.js
 * 
 * This component serves as the detailed feature page for Outcome-Based Interface,
 * showcasing its capabilities, benefits, and use cases.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { AdjustmentsHorizontalIcon, RocketLaunchIcon, PresentationChartLineIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const OutcomeBasedInterfaceFeature = () => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  // Use cases
  const useCases = [
    {
      id: 'goalBasedCampaigns',
      title: 'Goal-Based Campaigns',
      description: 'Define your business objectives and let the platform optimize campaigns to achieve them.',
      icon: <RocketLaunchIcon className="h-6 w-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      id: 'performanceOptimization',
      title: 'Performance Optimization',
      description: 'Automatically adjust campaign parameters to maximize ROI and achieve desired outcomes.',
      icon: <AdjustmentsHorizontalIcon className="h-6 w-6" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      id: 'resultsDashboards',
      title: 'Results Dashboards',
      description: 'View real-time progress toward your marketing goals with intuitive, outcome-focused dashboards.',
      icon: <PresentationChartLineIcon className="h-6 w-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      id: 'audienceTargeting',
      title: 'Audience Targeting',
      description: 'Define target audiences based on desired outcomes rather than traditional demographic segments.',
      icon: <UserGroupIcon className="h-6 w-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    }
  ];

  // Benefits
  const benefits = [
    {
      id: 1,
      title: '78% More Efficient Campaign Management',
      description: 'Focus on results instead of tactics, dramatically reducing time spent on campaign management.',
    },
    {
      id: 2,
      title: '52% Higher Marketing ROI',
      description: 'Outcome-based optimization ensures marketing resources are allocated to activities with the highest impact.',
    },
    {
      id: 3,
      title: 'Simplified Decision Making',
      description: 'Clear focus on business outcomes eliminates complexity in marketing strategy and execution.',
    },
    {
      id: 4,
      title: 'Continuous Improvement',
      description: 'AI-powered optimization continuously refines tactics to improve outcome achievement over time.',
    }
  ];

  return (
    <div ref={ref} className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-amber-600">
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
                  <span className="block">Outcome-Based Interface</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-orange-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  Focus on business results, not marketing tactics. Our outcome-based interface lets you define goals and automates the path to achieve them.
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                  <div className="rounded-md shadow">
                    <Link href="/signup" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-orange-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                      Start Free Trial
                    </Link>
                  </div>
                  <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                    <Link href="/features" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-800 bg-opacity-60 hover:bg-opacity-70 md:py-4 md:text-lg md:px-10">
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
            <h2 className="text-base font-semibold text-orange-600 tracking-wide uppercase">Feature Overview</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Marketing Focused on Results
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              ReachSpark's Outcome-Based Interface transforms how you approach marketing by focusing on business goals rather than marketing tactics.
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
                <div className="h-64 bg-orange-100 rounded-lg overflow-hidden">
                  <img
                    src="/images/features/outcome-based-dashboard.jpg"
                    alt="Outcome-Based Dashboard"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative mt-8">
                  <h3 className="text-2xl font-bold text-gray-900">Goal-Oriented Dashboard</h3>
                  <p className="mt-3 text-lg text-gray-500">
                    Our intuitive dashboard focuses on your business goals and shows real-time progress toward achieving them.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative"
              >
                <div className="h-64 bg-orange-100 rounded-lg overflow-hidden">
                  <img
                    src="/images/features/ai-optimization.jpg"
                    alt="AI Optimization"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative mt-8">
                  <h3 className="text-2xl font-bold text-gray-900">AI-Powered Optimization</h3>
                  <p className="mt-3 text-lg text-gray-500">
                    Our AI automatically optimizes marketing tactics to achieve your defined business outcomes efficiently.
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
            <h2 className="text-base font-semibold text-orange-600 tracking-wide uppercase">Use Cases</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Focus on What Matters
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              From goal-based campaigns to results-focused dashboards, our outcome-based interface helps you achieve real business results.
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
            <h2 className="text-base font-semibold text-orange-600 tracking-wide uppercase">Benefits</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Why Choose Outcome-Based Interface
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Our outcome-based interface delivers measurable results that help you achieve your business goals more efficiently.
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
                    <h3 className="text-xl font-bold text-orange-600">{benefit.title}</h3>
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
                  &ldquo;ReachSpark's outcome-based interface has completely transformed how we approach marketing. We're now focused on business results rather than marketing tactics, and our ROI has increased by 63% as a result.&rdquo;
                </p>
              </div>
              <footer className="mt-8">
                <div className="md:flex md:items-center md:justify-center">
                  <div className="md:flex-shrink-0">
                    <img
                      className="mx-auto h-10 w-10 rounded-full"
                      src="/images/testimonials/cmo-portrait.jpg"
                      alt=""
                    />
                  </div>
                  <div className="mt-3 text-center md:mt-0 md:ml-4 md:flex md:items-center">
                    <div className="text-base font-medium text-gray-900">Amanda Thompson</div>
                    <svg className="hidden md:block mx-1 h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 0h3L9 20H6l5-20z" />
                    </svg>
                    <div className="text-base font-medium text-gray-500">CMO, ResultsDriven Inc.</div>
                  </div>
                </div>
              </footer>
            </motion.blockquote>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-orange-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to focus on outcomes?</span>
            <span className="block">Start your free trial today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-orange-200">
            Experience the power of outcome-based marketing with a 7-day free trial. No credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-orange-600 bg-white hover:bg-orange-50 sm:w-auto"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OutcomeBasedInterfaceFeature;
