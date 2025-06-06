import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-0806D5TNHK"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-0806D5TNHK');
            `,
          }}
        />
        
        {/* Favicon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#4F46E5" />
        <meta name="msapplication-TileColor" content="#4F46E5" />
        <meta name="theme-color" content="#ffffff" />
        
        {/* SEO Meta Tags */}
        <meta name="author" content="ReachSpark" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ReachSpark" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@reachspark" />
        <meta name="twitter:image" content="/twitter-image.png" />
      </Head>
      <body className="antialiased text-gray-800 bg-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
