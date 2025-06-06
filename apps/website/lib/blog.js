import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Custom hook to fetch blog posts from Firestore
 * @param {Object} options - Query options
 * @returns {Object} - Blog posts and loading state
 */
export function useBlogPosts({
  limitCount = 10,
  category = null,
  tag = null,
  featured = false,
  published = true,
  sortBy = 'publishedAt',
  sortDirection = 'desc'
} = {}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        
        // Create base query
        let postsQuery = collection(db, 'blog_posts');
        
        // Add filters
        const filters = [];
        
        if (published) {
          filters.push(where('published', '==', true));
          filters.push(where('publishedAt', '<=', Timestamp.now()));
        }
        
        if (category) {
          filters.push(where('category', '==', category));
        }
        
        if (tag) {
          filters.push(where('tags', 'array-contains', tag));
        }
        
        if (featured) {
          filters.push(where('featured', '==', true));
        }
        
        // Apply filters and sorting
        postsQuery = query(
          postsQuery,
          ...filters,
          orderBy(sortBy, sortDirection),
          limit(limitCount)
        );
        
        // Execute query
        const querySnapshot = await getDocs(postsQuery);
        
        // Process results
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamps to JS Dates
          publishedAt: doc.data().publishedAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        
        setPosts(fetchedPosts);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, [limitCount, category, tag, featured, published, sortBy, sortDirection]);

  return { posts, loading, error };
}

/**
 * Custom hook to fetch a single blog post from Firestore
 * @param {string} slug - Post slug
 * @returns {Object} - Blog post and loading state
 */
export function useBlogPost(slug) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Query post by slug
        const postQuery = query(
          collection(db, 'blog_posts'),
          where('slug', '==', slug),
          limit(1)
        );
        
        const querySnapshot = await getDocs(postQuery);
        
        if (querySnapshot.empty) {
          setPost(null);
          return;
        }
        
        const doc = querySnapshot.docs[0];
        const postData = {
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamps to JS Dates
          publishedAt: doc.data().publishedAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        };
        
        setPost(postData);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPost();
  }, [slug]);

  return { post, loading, error };
}

/**
 * Custom hook to fetch blog categories from Firestore
 * @returns {Object} - Blog categories and loading state
 */
export function useBlogCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        
        const categoriesQuery = query(
          collection(db, 'blog_categories'),
          orderBy('name')
        );
        
        const querySnapshot = await getDocs(categoriesQuery);
        
        const fetchedCategories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCategories(fetchedCategories);
      } catch (err) {
        console.error('Error fetching blog categories:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategories();
  }, []);

  return { categories, loading, error };
}

/**
 * Custom hook to fetch popular blog tags from Firestore
 * @param {number} limitCount - Number of tags to fetch
 * @returns {Object} - Blog tags and loading state
 */
export function useBlogTags(limitCount = 10) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true);
        
        const tagsQuery = query(
          collection(db, 'blog_tags'),
          orderBy('postCount', 'desc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(tagsQuery);
        
        const fetchedTags = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTags(fetchedTags);
      } catch (err) {
        console.error('Error fetching blog tags:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTags();
  }, [limitCount]);

  return { tags, loading, error };
}

/**
 * Custom hook to fetch related blog posts
 * @param {string} currentPostId - Current post ID to exclude
 * @param {Array} tags - Tags to match
 * @param {string} category - Category to match
 * @param {number} limitCount - Number of related posts to fetch
 * @returns {Object} - Related posts and loading state
 */
export function useRelatedPosts({
  currentPostId,
  tags = [],
  category,
  limitCount = 3
}) {
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRelatedPosts() {
      if (!currentPostId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // First try to find posts with matching tags
        if (tags && tags.length > 0) {
          const tagQuery = query(
            collection(db, 'blog_posts'),
            where('published', '==', true),
            where('publishedAt', '<=', Timestamp.now()),
            where('tags', 'array-contains-any', tags.slice(0, 10)), // Firestore limits to 10 values
            where('id', '!=', currentPostId),
            orderBy('publishedAt', 'desc'),
            limit(limitCount)
          );
          
          const tagQuerySnapshot = await getDocs(tagQuery);
          
          if (!tagQuerySnapshot.empty) {
            const tagRelatedPosts = tagQuerySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              publishedAt: doc.data().publishedAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
            }));
            
            setRelatedPosts(tagRelatedPosts);
            setLoading(false);
            return;
          }
        }
        
        // If no tag matches or not enough, try category matches
        if (category) {
          const categoryQuery = query(
            collection(db, 'blog_posts'),
            where('published', '==', true),
            where('publishedAt', '<=', Timestamp.now()),
            where('category', '==', category),
            where('id', '!=', currentPostId),
            orderBy('publishedAt', 'desc'),
            limit(limitCount)
          );
          
          const categoryQuerySnapshot = await getDocs(categoryQuery);
          
          if (!categoryQuerySnapshot.empty) {
            const categoryRelatedPosts = categoryQuerySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              publishedAt: doc.data().publishedAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
            }));
            
            setRelatedPosts(categoryRelatedPosts);
            setLoading(false);
            return;
          }
        }
        
        // If still no matches, just get recent posts
        const recentQuery = query(
          collection(db, 'blog_posts'),
          where('published', '==', true),
          where('publishedAt', '<=', Timestamp.now()),
          where('id', '!=', currentPostId),
          orderBy('publishedAt', 'desc'),
          limit(limitCount)
        );
        
        const recentQuerySnapshot = await getDocs(recentQuery);
        
        const recentPosts = recentQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          publishedAt: doc.data().publishedAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        
        setRelatedPosts(recentPosts);
      } catch (err) {
        console.error('Error fetching related posts:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRelatedPosts();
  }, [currentPostId, tags, category, limitCount]);

  return { relatedPosts, loading, error };
}
