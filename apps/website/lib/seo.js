// SEO optimization utilities for ReachSpark website

/**
 * Generates structured data for the website in JSON-LD format
 * @param {Object} options - Configuration options for the structured data
 * @returns {Object} - JSON-LD structured data object
 */
export function generateStructuredData(options = {}) {
  const {
    type = 'WebSite',
    name = 'ReachSpark',
    description = 'AI-powered marketing platform for content generation, social media management, and website building',
    url = 'https://reachspark.com',
    logo = 'https://reachspark.com/logo.png',
    sameAs = [
      'https://twitter.com/reachspark',
      'https://facebook.com/reachspark',
      'https://linkedin.com/company/reachspark',
      'https://instagram.com/reachspark'
    ],
    potentialAction = {
      "@type": "SearchAction",
      "target": "https://reachspark.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  } = options;

  return {
    "@context": "https://schema.org",
    "@type": type,
    "name": name,
    "description": description,
    "url": url,
    ...(logo && { "logo": logo }),
    ...(sameAs && { "sameAs": sameAs }),
    ...(potentialAction && { "potentialAction": potentialAction })
  };
}

/**
 * Generates structured data for a blog post in JSON-LD format
 * @param {Object} post - Blog post data
 * @returns {Object} - JSON-LD structured data object for the blog post
 */
export function generateBlogPostStructuredData(post) {
  const {
    title,
    description,
    url,
    imageUrl,
    datePublished,
    dateModified,
    authorName,
    authorUrl,
    publisherName = 'ReachSpark',
    publisherLogo = 'https://reachspark.com/logo.png'
  } = post;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "image": imageUrl,
    "url": url,
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": authorUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": publisherName,
      "logo": {
        "@type": "ImageObject",
        "url": publisherLogo
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  };
}

/**
 * Generates meta tags for SEO
 * @param {Object} options - Configuration options for meta tags
 * @returns {Object} - Object containing meta tag properties
 */
export function generateMetaTags(options = {}) {
  const {
    title = 'ReachSpark - AI-Powered Marketing Platform',
    description = 'Automate your marketing with AI-powered content generation, social media management, and website building tools.',
    url = 'https://reachspark.com',
    imageUrl = 'https://reachspark.com/og-image.png',
    imageAlt = 'ReachSpark AI Marketing Platform',
    twitterHandle = '@reachspark',
    keywords = 'AI marketing, content generation, social media management, website builder, marketing automation',
    canonical = 'https://reachspark.com'
  } = options;

  return {
    title,
    description,
    canonical,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: imageAlt,
          width: 1200,
          height: 630,
        },
      ],
      site_name: 'ReachSpark',
    },
    twitter: {
      handle: twitterHandle,
      site: twitterHandle,
      cardType: 'summary_large_image',
    },
    additionalMetaTags: [
      {
        name: 'keywords',
        content: keywords,
      },
      {
        name: 'author',
        content: 'ReachSpark',
      },
    ],
  };
}

/**
 * Generates a sitemap entry for a page
 * @param {Object} page - Page data
 * @returns {Object} - Sitemap entry object
 */
export function generateSitemapEntry(page) {
  const {
    url,
    lastModified,
    changeFrequency = 'weekly',
    priority = 0.7
  } = page;

  return {
    url,
    lastModified,
    changeFrequency,
    priority
  };
}

/**
 * Optimizes image alt text for SEO
 * @param {string} filename - Image filename
 * @param {string} context - Context where the image is used
 * @returns {string} - SEO-optimized alt text
 */
export function optimizeImageAltText(filename, context = '') {
  // Remove file extension and replace dashes/underscores with spaces
  let altText = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  
  // Capitalize first letter of each word
  altText = altText.replace(/\b\w/g, l => l.toUpperCase());
  
  // Add context if provided
  if (context) {
    altText = `${altText} - ${context}`;
  }
  
  return altText;
}

/**
 * Generates a canonical URL
 * @param {string} path - URL path
 * @param {string} baseUrl - Base URL
 * @returns {string} - Canonical URL
 */
export function generateCanonicalUrl(path, baseUrl = 'https://reachspark.com') {
  // Remove trailing slash from baseUrl if present
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Ensure path starts with a slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${base}${formattedPath}`;
}

/**
 * Generates breadcrumb structured data
 * @param {Array} breadcrumbs - Array of breadcrumb items
 * @returns {Object} - Breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(breadcrumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

/**
 * Generates FAQ structured data
 * @param {Array} faqs - Array of FAQ items
 * @returns {Object} - FAQ structured data
 */
export function generateFAQStructuredData(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Optimizes a title for SEO
 * @param {string} title - Original title
 * @param {string} suffix - Title suffix (e.g., brand name)
 * @param {number} maxLength - Maximum title length
 * @returns {string} - SEO-optimized title
 */
export function optimizeTitle(title, suffix = '| ReachSpark', maxLength = 60) {
  // If title is already too long, truncate it
  if (title.length >= maxLength) {
    return title.substring(0, maxLength - 3) + '...';
  }
  
  // If title with suffix is too long, return just the title
  if ((title + ' ' + suffix).length > maxLength) {
    return title;
  }
  
  // Return title with suffix
  return `${title} ${suffix}`;
}

/**
 * Optimizes a description for SEO
 * @param {string} description - Original description
 * @param {number} maxLength - Maximum description length
 * @returns {string} - SEO-optimized description
 */
export function optimizeDescription(description, maxLength = 160) {
  if (description.length <= maxLength) {
    return description;
  }
  
  // Truncate at the last complete sentence that fits within maxLength
  const truncated = description.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > 0) {
    return truncated.substring(0, lastPeriod + 1);
  }
  
  // If no complete sentence, truncate at the last space
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  // If no space, just truncate
  return truncated + '...';
}
