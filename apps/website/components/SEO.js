import { useEffect } from 'react';
import Head from 'next/head';
import { generateMetaTags, generateStructuredData } from '../lib/seo';

/**
 * SEO component for consistent SEO implementation across pages
 * @param {Object} props - Component props
 * @returns {JSX.Element} - SEO component with meta tags
 */
const SEO = ({ 
  title, 
  description, 
  canonical, 
  ogImage, 
  ogType = 'website',
  structuredData,
  structuredDataType,
  noindex = false,
  keywords,
  children 
}) => {
  // Generate meta tags based on provided props
  const metaTags = generateMetaTags({
    title,
    description,
    url: canonical,
    imageUrl: ogImage,
    keywords,
    canonical
  });

  // Generate structured data if not explicitly provided
  const pageStructuredData = structuredData || generateStructuredData({
    type: structuredDataType || 'WebSite',
    name: title,
    description,
    url: canonical
  });

  // Log structured data for debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Structured Data:', pageStructuredData);
    }
  }, [pageStructuredData]);

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{metaTags.title}</title>
      <meta name="description" content={metaTags.description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={metaTags.openGraph.url} />
      <meta property="og:title" content={metaTags.openGraph.title} />
      <meta property="og:description" content={metaTags.openGraph.description} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content={metaTags.openGraph.site_name} />
      
      {/* Twitter */}
      <meta name="twitter:card" content={metaTags.twitter.cardType} />
      <meta name="twitter:site" content={metaTags.twitter.site} />
      <meta name="twitter:title" content={metaTags.title} />
      <meta name="twitter:description" content={metaTags.description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData) }}
      />
      
      {/* Additional Meta Tags */}
      {metaTags.additionalMetaTags?.map((tag, index) => (
        <meta key={`${tag.name}-${index}`} name={tag.name} content={tag.content} />
      ))}
      
      {/* Additional children elements */}
      {children}
    </Head>
  );
};

export default SEO;
