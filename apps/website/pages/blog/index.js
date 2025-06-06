import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useBlogPosts, useBlogCategories, useBlogTags } from '../lib/blog';
import SEO from '../components/SEO';

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTag, setActiveTag] = useState(null);
  const { posts, loading: postsLoading } = useBlogPosts({ 
    limitCount: 12,
    category: activeCategory === 'all' ? null : activeCategory,
    tag: activeTag
  });
  const { categories, loading: categoriesLoading } = useBlogCategories();
  const { tags, loading: tagsLoading } = useBlogTags(20);

  // Placeholder posts for when Firebase data is loading
  const placeholderPosts = Array(6).fill(0).map((_, i) => ({
    id: `placeholder-${i}`,
    title: 'Loading blog post...',
    excerpt: 'Content is loading. Please wait a moment while we fetch the latest articles.',
    category: 'Loading',
    author: { name: 'Author' },
    publishedAt: new Date()
  }));

  // Use placeholder posts if Firebase data is loading
  const displayPosts = postsLoading ? placeholderPosts : posts;

  // Placeholder categories for when Firebase data is loading
  const placeholderCategories = [
    { id: 'all', name: 'All' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'social-media', name: 'Social Media' },
    { id: 'content', name: 'Content' },
    { id: 'analytics', name: 'Analytics' }
  ];

  // Use placeholder categories if Firebase data is loading
  const displayCategories = categoriesLoading 
    ? placeholderCategories 
    : [{ id: 'all', name: 'All' }, ...categories];

  // Placeholder tags for when Firebase data is loading
  const placeholderTags = Array(10).fill(0).map((_, i) => ({
    id: `tag-${i}`,
    name: `Tag ${i+1}`,
    postCount: Math.floor(Math.random() * 20) + 1
  }));

  // Use placeholder tags if Firebase data is loading
  const displayTags = tagsLoading ? placeholderTags : tags;

  // Clear tag filter when category changes
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setActiveTag(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Blog - ReachSpark Marketing Platform"
        description="Expert advice, industry trends, and actionable tips to elevate your marketing strategy with AI-powered tools and techniques."
        canonical="https://reachspark.com/blog"
        ogImage="https://reachspark.com/images/blog-og-image.jpg"
        structuredDataType="Blog"
      />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-primary text-white">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                ReachSpark Blog
              </h1>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
                Expert advice, industry trends, and actionable tips to elevate your marketing strategy.
              </p>
            </motion.div>
          </div>
        </section>
        
        {/* Blog Content Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row">
              {/* Main Content */}
              <div className="w-full lg:w-3/4 lg:pr-8">
                {/* Category Tabs */}
                <div className="flex flex-wrap mb-8">
                  {displayCategories.map((category) => (
                    <button
                      key={category.id}
                      className={`px-4 py-2 mr-2 mb-2 rounded-full text-sm font-medium transition-all ${
                        activeCategory === category.id
                          ? 'bg-primary text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                
                {/* Active Filters */}
                {activeTag && (
                  <div className="mb-8 flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Filtered by:</span>
                    <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm flex items-center">
                      {activeTag}
                      <button 
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        onClick={() => setActiveTag(null)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </span>
                  </div>
                )}
                
                {/* Blog Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {displayPosts.map((post) => (
                    <motion.div 
                      key={post.id}
                      className="blog-card overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Link href={`/blog/${post.slug || post.id}`} className="block">
                        <div className="relative h-48 overflow-hidden">
                          {post.coverImage ? (
                            <Image 
                              src={post.coverImage} 
                              alt={post.title} 
                              className="blog-card-image"
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center">
                              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                              </svg>
                            </div>
                          )}
                          {post.category && (
                            <span className="absolute top-4 left-4 blog-card-tag bg-white text-primary">
                              {post.category}
                            </span>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-heading font-semibold mb-2 line-clamp-2">{post.title}</h3>
                          <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {post.author?.avatar ? (
                                <Image 
                                  src={post.author.avatar} 
                                  alt={post.author.name} 
                                  width={32} 
                                  height={32} 
                                  className="rounded-full mr-2"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                  <span className="text-xs text-gray-600">
                                    {post.author?.name?.charAt(0) || 'A'}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-gray-500">{post.author?.name || 'Anonymous'}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }) : 'Draft'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                
                {/* Empty State */}
                {!postsLoading && posts.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                    <h3 className="text-xl font-heading font-semibold mb-2">No posts found</h3>
                    <p className="text-gray-600 mb-4">
                      No posts match your current filters. Try changing your category or tag selection.
                    </p>
                    <button 
                      className="btn-secondary text-primary border-primary hover:bg-primary hover:text-white"
                      onClick={() => {
                        setActiveCategory('all');
                        setActiveTag(null);
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
                
                {/* Pagination - To be implemented with Firebase pagination */}
                <div className="mt-12 flex justify-center">
                  <button className="btn-secondary text-primary border-primary hover:bg-primary hover:text-white">
                    Load More Articles
                  </button>
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="w-full lg:w-1/4 mt-12 lg:mt-0">
                {/* Search Box */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                  <h3 className="text-lg font-heading font-semibold mb-4">Search Articles</h3>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button className="absolute right-3 top-2.5 text-gray-400 hover:text-primary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Popular Tags */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                  <h3 className="text-lg font-heading font-semibold mb-4">Popular Topics</h3>
                  <div className="flex flex-wrap">
                    {displayTags.map((tag) => (
                      <button
                        key={tag.id}
                        className={`px-3 py-1 m-1 rounded-full text-sm ${
                          activeTag === tag.name
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } transition-colors`}
                        onClick={() => setActiveTag(tag.name)}
                      >
                        {tag.name} ({tag.postCount})
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Newsletter Signup */}
                <div className="bg-gradient-primary text-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-heading font-semibold mb-4">Subscribe to Our Newsletter</h3>
                  <p className="text-sm opacity-90 mb-4">
                    Get the latest marketing insights, strategies, and tips delivered straight to your inbox.
                  </p>
                  <form className="space-y-3">
                    <input 
                      type="email" 
                      placeholder="Your email address" 
                      className="w-full px-4 py-2 text-gray-800 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                    />
                    <button type="submit" className="w-full btn bg-white text-primary hover:bg-gray-100">
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
              Ready to Transform Your Marketing?
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
              Join thousands of businesses using ReachSpark's AI-powered platform to optimize their marketing efforts and drive better results.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/signup" className="btn-primary">
                Start Your Free Trial
              </Link>
              <Link href="/demo" className="btn-secondary text-primary border-primary hover:bg-primary hover:text-white">
                Schedule a Demo
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
