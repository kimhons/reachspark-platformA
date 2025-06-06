/**
 * Navigation.js
 * 
 * This component provides the main navigation for the ReachSpark website,
 * including links to all feature pages, pricing, and trial signup.
 * It supports responsive design across all device sizes and includes
 * a toggle for switching between traditional, conversational, and hybrid views.
 */

import React, { useState, useEffect } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChatBubbleLeftRightIcon, 
  Squares2X2Icon, 
  TableCellsIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Navigation = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [interfaceStyle, setInterfaceStyle] = useState('traditional');
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll events for sticky navigation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save interface preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStyle = localStorage.getItem('interfaceStyle');
      if (savedStyle) {
        setInterfaceStyle(savedStyle);
      }
    }
  }, []);

  const updateInterfaceStyle = (style) => {
    setInterfaceStyle(style);
    localStorage.setItem('interfaceStyle', style);
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Resources', href: '/resources' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path) => {
    return router.pathname === path;
  };

  // Determine navigation style classes based on selected interface style
  const getNavClasses = () => {
    const baseClasses = "transition-all duration-300";
    
    switch(interfaceStyle) {
      case 'conversational':
        return `${baseClasses} bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg my-2 mx-4`;
      case 'hybrid':
        return `${baseClasses} bg-white border-b border-indigo-100 shadow-md`;
      default: // traditional
        return `${baseClasses} bg-white shadow`;
    }
  };

  // Determine link style classes based on selected interface style
  const getLinkClasses = (active) => {
    const baseClasses = "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200";
    
    switch(interfaceStyle) {
      case 'conversational':
        return `${baseClasses} ${
          active
            ? 'border-white text-white font-bold'
            : 'border-transparent text-indigo-100 hover:text-white'
        }`;
      case 'hybrid':
        return `${baseClasses} ${
          active
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-indigo-500'
        }`;
      default: // traditional
        return `${baseClasses} ${
          active
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`;
    }
  };

  // Determine mobile link style classes based on selected interface style
  const getMobileLinkClasses = (active) => {
    const baseClasses = "block pl-3 pr-4 py-2 border-l-4 text-base font-medium";
    
    switch(interfaceStyle) {
      case 'conversational':
        return `${baseClasses} ${
          active
            ? 'bg-indigo-700 border-white text-white'
            : 'border-transparent text-indigo-100 hover:bg-indigo-700 hover:text-white'
        }`;
      case 'hybrid':
        return `${baseClasses} ${
          active
            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-700'
        }`;
      default: // traditional
        return `${baseClasses} ${
          active
            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
        }`;
    }
  };

  // Get logo style based on interface style
  const getLogoStyle = () => {
    switch(interfaceStyle) {
      case 'conversational':
        return "text-white";
      case 'hybrid':
      case 'traditional':
      default:
        return "text-indigo-600";
    }
  };

  // Get button styles based on interface style
  const getLoginButtonStyle = () => {
    switch(interfaceStyle) {
      case 'conversational':
        return "text-indigo-600 bg-white hover:bg-indigo-50";
      case 'hybrid':
        return "text-white bg-indigo-500 hover:bg-indigo-600";
      default: // traditional
        return "text-indigo-600 bg-white hover:bg-gray-50 border border-indigo-200";
    }
  };

  const getTrialButtonStyle = () => {
    switch(interfaceStyle) {
      case 'conversational':
        return "text-indigo-600 bg-white hover:bg-indigo-50 border border-white";
      case 'hybrid':
        return "text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700";
      default: // traditional
        return "text-white bg-indigo-600 hover:bg-indigo-700";
    }
  };

  // Determine if the navigation should be sticky
  const navContainerClasses = `fixed top-0 left-0 right-0 z-50 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-md' : ''}`;

  return (
    <div className={navContainerClasses}>
      <Disclosure as="nav" className={getNavClasses()}>
        {({ open }) => (
          <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/">
                      <span className={`text-2xl font-bold ${getLogoStyle()}`}>ReachSpark</span>
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={getLinkClasses(isActive(item.href))}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  {/* Interface Style Toggle */}
                  <div className="mr-4 flex items-center border rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateInterfaceStyle('traditional')}
                      className={`p-2 ${interfaceStyle === 'traditional' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-500 hover:text-indigo-600'}`}
                      title="Traditional View"
                    >
                      <Squares2X2Icon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => updateInterfaceStyle('conversational')}
                      className={`p-2 ${interfaceStyle === 'conversational' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-500 hover:text-indigo-600'}`}
                      title="Conversational View"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => updateInterfaceStyle('hybrid')}
                      className={`p-2 ${interfaceStyle === 'hybrid' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-500 hover:text-indigo-600'}`}
                      title="Hybrid View"
                    >
                      <TableCellsIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Link
                      href="/login"
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3 ${getLoginButtonStyle()}`}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${getTrialButtonStyle()}`}
                    >
                      Start Free Trial
                    </Link>
                  </div>
                </div>
                <div className="-mr-2 flex items-center sm:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={getMobileLinkClasses(isActive(item.href))}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
              
              {/* Interface Style Toggle for Mobile */}
              <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => updateInterfaceStyle('traditional')}
                    className={`p-2 rounded ${interfaceStyle === 'traditional' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-indigo-600'}`}
                    title="Traditional View"
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => updateInterfaceStyle('conversational')}
                    className={`p-2 rounded ${interfaceStyle === 'conversational' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-indigo-600'}`}
                    title="Conversational View"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => updateInterfaceStyle('hybrid')}
                    className={`p-2 rounded ${interfaceStyle === 'hybrid' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-indigo-600'}`}
                    title="Hybrid View"
                  >
                    <TableCellsIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center justify-center px-4 space-x-3">
                  <Link
                    href="/login"
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${getLoginButtonStyle()}`}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${getTrialButtonStyle()}`}
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      
      {/* Spacer to prevent content from being hidden under fixed navbar */}
      <div className="h-16"></div>
    </div>
  );
};

export default Navigation;
