/**
 * Layout.js
 * 
 * This component provides the main layout wrapper for all pages in the ReachSpark website,
 * ensuring consistent navigation, footer, and structure across the site.
 */

import React from 'react';
import Head from 'next/head';
import Navigation from './Navigation';
import Footer from './Footer';

const Layout = ({ children, title = 'ReachSpark - AI-Powered Marketing Platform' }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content="ReachSpark is an AI-powered marketing platform that helps businesses automate and optimize their marketing efforts." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex flex-col min-h-screen">
        <Navigation />
        
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Layout;
