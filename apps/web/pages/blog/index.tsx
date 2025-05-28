import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { mockBlogPosts, BlogPost } from '../../lib/mockData';

interface BlogIndexProps {
  posts: BlogPost[];
  featuredPost: BlogPost;
}

export default function BlogIndex({ posts, featuredPost }: BlogIndexProps) {
  return (
    <>
      <Head>
        <title>Blog | Men's Health Finder</title>
        <meta name="description" content="Read the latest articles about men's health, TRT, ED treatment, and more." />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Health & Wellness Blog</h1>
        
        {/* Featured post */}
        {featuredPost && (
          <div className="mb-16">
            <Link href={`/blog/${featuredPost.slug}`} className="group">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 card p-0 overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={featuredPost.featuredImage} 
                    alt={featuredPost.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featuredPost.categories.map((category) => (
                      <span 
                        key={category} 
                        className="bg-[#222222] text-white text-xs px-3 py-1 rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  
                  <p className="text-gray-400 mb-6">
                    {featuredPost.excerpt}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {new Date(featuredPost.publishDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="text-primary font-medium flex items-center">
                      Read more 
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
        
        {/* All posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link 
              key={post.id} 
              href={`/blog/${post.slug}`}
              className="card overflow-hidden group"
            >
              <div className="aspect-[16/9] w-full overflow-hidden">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <p className="text-xs text-gray-400 mb-2">
                  {new Date(post.publishDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-3">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Sort posts by date (newest first)
  const sortedPosts = [...mockBlogPosts].sort((a, b) => 
    new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
  
  // Get the newest post as the featured post
  const featuredPost = sortedPosts[0];
  
  // Get the rest of the posts
  const remainingPosts = sortedPosts.slice(1);

  return {
    props: {
      posts: remainingPosts,
      featuredPost,
    },
  };
};