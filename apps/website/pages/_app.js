/**
 * _app.js
 * 
 * This is the main application wrapper for the ReachSpark website.
 * It applies the Layout component to all pages for consistent navigation and footer.
 */

import React from 'react';
import '../styles/globals.css';
import Layout from '../components/Layout';

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
