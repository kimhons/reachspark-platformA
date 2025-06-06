/**
 * HomePage.js
 * 
 * This component serves as the main landing page for the ReachSpark platform,
 * showcasing all core features and new enhancements in a balanced presentation.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { BrainIcon, LinkIcon } from '../components/icons/CustomIcons';
import Link from 'next/link';

const HomePage = () => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  // Core existing features
  const coreFeatures = [
    {
      id: 'aiCopilot',
      name: 'AI Marketing Copilot',
      description: 'Generate high-converting marketing content with AI that understands your brand voice and audience preferences.',
      icon: <DocumentTextIcon className="h-6 w-6" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      metrics: '85% time savings in content creation',
      link: '/features/ai-marketing-copilot',
      animation: {
        delay: 0.1
      }
    },
    {
      id: 'predictiveJourney',
      name: 'Predictive Journey Orchestration',
      description: 'Map and optimize customer journeys with AI-powered behavior prediction and personalized touchpoints.',
      icon: <ArrowPathIcon className="h-6 w-6" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      metrics: '35% higher customer lifetime value',
      link: '/features/predictive-journey',
      animation: {
        delay: 0.2
      }
    },
    {
      id: 'influencerMarketplace',
      name: 'Influencer Marketplace',
      description: 'Discover, vet, and collaborate with influencers who align with your brand values and audience demographics.',
      icon: <UserGroupIcon className="h-6 w-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      metrics: '285% ROI on influencer campaigns',
      link: '/features/influencer-marketplace',
      animation: {
        delay: 0.3
      }
    },
    {
      id: 'semanticContent',
      name: 'Semantic Content Analysis',
      description: 'Analyze content performance and optimize messaging based on semantic understanding and audience engagement.',
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      metrics: '78% increase in content engagement',
      link: '/features/semantic-content',
      animation: {
        delay: 0.4
      }
    },
    {
      id: 'revenueAttribution',
      name: 'Revenue Attribution',
      description: 'Track the impact of every marketing touchpoint with advanced multi-touch attribution modeling.',
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      metrics: '42% increase in marketing ROI',
      link: '/features/revenue-attribution',
      animation: {
        delay: 0.5
      }
    },
    {
      id: 'omnichannelPersonalization',
      name: 'Omnichannel Personalization',
      description: 'Deliver consistent, personalized experiences across all customer touchpoints and marketing channels.',
      icon: <GlobeAltIcon className="h-6 w-6" />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      metrics: '142% lift in conversion rates',
      link: '/features/omnichannel-personalization',
      animation: {
        delay: 0.6
      }
    }
  ];

  // New enhanced features
  const enhancedFeatures = [
    {
      id: 'predictiveWorkflows',
      name: 'Predictive Workflows',
      description: 'Harness AI to predict outcomes, optimize performance, and automate decision-making across your marketing ecosystem.',
      icon: <BrainIcon className="h-6 w-6" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      metrics: '87% increase in lead conversion',
      link: '/features/predictive-workflows',
      animation: {
        delay: 0.1
      }
    },
    {
      id: 'ambientIntelligence',
      name: 'Ambient Intelligence',
      description: 'An always-on intelligence layer that works in the background, continuously learning and making decisions 24/7.',
      icon: <SparklesIcon className="h-6 w-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      metrics: '24/7 autonomous operation',
      link: '/features/ambient-intelligence',
      animation: {
        delay: 0.2
      }
    },
    {
      id: 'crossChannelOrchestration',
      name: 'Cross-Channel Orchestration',
      description: 'Unify your marketing efforts across all channels with intelligent orchestration that creates seamless customer experiences.',
      icon: <LinkIcon className="h-6 w-6" />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      metrics: '68% reduction in campaign management time',
      link: '/features/cross-channel-orchestration',
      animation: {
        delay: 0.3
      }
    },
    {
      id: 'outcomeBasedInterface',
      name: 'Outcome-Based Interface',
      description: 'Experience a revolutionary UI focused on business results rather than features, with goal-based navigation and workflows.',
      icon: <RocketLaunchIcon className="h-6 w-6" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      metrics: '53% faster time to value',
      link: '/features/outcome-based-interface',
      animation: {
        delay: 0.4
      }
    }
  ];

  // Stats
  const stats = [
    { id: 1, name: 'Increase in Marketing ROI', value: '42%' },
    { id: 2, name: 'Time Saved on Campaign Management', value: '68%' },
    { id: 3, name: 'Higher Lead Conversion Rate', value: '87%' },
    { id: 4, name: 'Autonomous Operation', value: '24/7' }
  ];

  return (
    <div ref={ref} className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-y-0 h-full w-full" aria-hidden="true">
          <div className="relative h-full">
            <svg
              className="absolute right-full transform translate-y-1/3 translate-x-1/4 md:translate-y-1/2 sm:translate-x-1/2 lg:translate-x-full"
              width="404"
              height="784"
              fill="none"
              viewBox="0 0 404 784"
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
                  <rect x="0" y="0" width="4" height="4" className="text-gray-200" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="784" fill="url(#e229dbec-10e9-49ee-8ec3-0286ca089edf)" />
            </svg>
            <svg
              className="absolute left-full transform -translate-y-3/4 -translate-x-1/4 sm:-translate-x-1/2 md:-translate-y-1/2 lg:-translate-x-3/4"
              width="404"
              height="784"
              fill="none"
              viewBox="0 0 404 784"
            >
              <defs>
                <pattern
                  id="d2a68204-c383-44b1-b99f-42ccff4e5365"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="4" height="4" className="text-gray-200" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="784" fill="url(#d2a68204-c383-44b1-b99f-42ccff4e5365)" />
            </svg>
          </div>
        </div>

        <div className="relative pt-6 pb-16 sm:pb-24">
          <div className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Transform Your Marketing with</span>
                  <span className="block text-indigo-600">Autonomous Intelligence</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  ReachSpark combines powerful AI, predictive analytics, and cross-channel orchestration to deliver exceptional marketing results with minimal human intervention.
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                  <div className="rounded-md shadow">
                    <Link href="/signup" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                      Start Free Trial
                    </Link>
                  </div>
                  <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                    <Link href="/features" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                      Explore Features
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-indigo-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 gap-5 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div key={stat.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600">{stat.value}</dd>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Core Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Core Capabilities</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Powerful Marketing Features
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              ReachSpark's comprehensive suite of marketing tools helps you create, optimize, and measure your marketing efforts.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: feature.animation.delay }}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-md ${feature.bgColor} ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">{feature.name}</h3>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">{feature.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {feature.metrics}
                    </span>
                    <Link href={feature.link} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Learn more <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="py-16 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">New Enhancements</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Next-Generation Intelligence
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Our latest enhancements bring autonomous, 24/7 marketing intelligence to take your results to the next level.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2">
            {enhancedFeatures.map((feature) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: feature.animation.delay }}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-md ${feature.bgColor} ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">{feature.name}</h3>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">{feature.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {feature.metrics}
                    </span>
                    <Link href={feature.link} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Learn more <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="py-16 bg-white overflow-hidden">
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
                  &ldquo;ReachSpark's autonomous marketing intelligence has completely transformed our approach. We've seen a 42% increase in ROI while reducing our team's workload by over 60%.&rdquo;
                </p>
              </div>
              <footer className="mt-8">
                <div className="md:flex md:items-center md:justify-center">
                  <div className="md:flex-shrink-0">
                    <img
                      className="mx-auto h-10 w-10 rounded-full"
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt=""
                    />
                  </div>
                  <div className="mt-3 text-center md:mt-0 md:ml-4 md:flex md:items-center">
                    <div className="text-base font-medium text-gray-900">Sarah Thompson</div>
                    <svg className="hidden md:block mx-1 h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 0h3L9 20H6l5-20z" />
                    </svg>
                    <div className="text-base font-medium text-gray-500">CMO, TechVision Inc.</div>
                  </div>
                </div>
              </footer>
            </motion.blockquote>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to transform your marketing?</span>
            <span className="block">Start your free trial today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            Experience the power of autonomous marketing intelligence with a 7-day free trial. No credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
