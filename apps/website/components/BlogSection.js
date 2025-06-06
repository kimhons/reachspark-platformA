import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useBlogPosts, useBlogCategories, useBlogTags } from '../lib/blog';
import SEO from '../components/SEO';

const BlogCard = ({ post }) => {
  return (
    <motion.div 
      className="blog-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link href={`/blog/${post.slug}`} className="block">
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
  );
};

const BlogSection = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const { posts, loading: postsLoading } = useBlogPosts({ 
    limitCount: 6,
    category: activeCategory === 'all' ? null : activeCategory
  });
  const { categories, loading: categoriesLoading } = useBlogCategories();
  const { tags, loading: tagsLoading } = useBlogTags(10);

  // Placeholder posts for when Firebase data is loading
  const placeholderPosts = [
    {
      id: 'placeholder-1',
      title: 'Top 10 AI Marketing Strategies for 2025',
      excerpt: 'Discover the cutting-edge AI marketing strategies that will dominate the industry in 2025 and beyond.',
      category: 'Marketing',
      author: { name: 'Sarah Johnson' },
      publishedAt: new Date('2025-04-15')
    },
    {
      id: 'placeholder-2',
      title: 'How to Optimize Your Social Media Presence',
      excerpt: 'Learn proven techniques to enhance your brand's social media presence and increase engagement across all platforms.',
      category: 'Social Media',
      author: { name: 'Michael Chen' },
      publishedAt: new Date('2025-04-10')
    },
    {
      id: 'placeholder-3',
      title: 'The Future of Content Marketing',
      excerpt: 'Explore emerging trends in content marketing and how AI is revolutionizing content creation and distribution.',
      category: 'Content',
      author: { name: 'Emily Rodriguez' },
      publishedAt: new Date('2025-04-05')
    }
  ];

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
  const placeholderTags = [
    { id: 'ai', name: 'AI', postCount: 24 },
    { id: 'marketing', name: 'Marketing', postCount: 18 },
    { id: 'social-media', name: 'Social Media', postCount: 15 },
    { id: 'analytics', name: 'Analytics', postCount: 12 },
    { id: 'content', name: 'Content', postCount: 10 }
  ];

  // Use placeholder tags if Firebase data is loading
  const displayTags = tagsLoading ? placeholderTags : tags;

  return (
    <div className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Latest Insights & Resources
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Expert advice, industry trends, and actionable tips to elevate your marketing strategy.
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center mb-12">
          {displayCategories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 m-1 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link href="/blog" className="btn-primary">
            View All Articles
          </Link>
        </div>

        {/* Popular Tags */}
        <div className="mt-16 bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-xl font-heading font-semibold mb-4">Popular Topics</h3>
          <div className="flex flex-wrap">
            {displayTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.id}`}
                className="px-3 py-1 m-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                {tag.name} ({tag.postCount})
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogSection;
