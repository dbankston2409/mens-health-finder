import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { mockBlogPosts, BlogPost } from '../../lib/mockData';

interface BlogPostPageProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

export default function BlogPostPage({ post, relatedPosts }: BlogPostPageProps) {
  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <p className="mt-4">The blog post you're looking for doesn't exist.</p>
        <Link href="/" className="text-primary hover:underline mt-4 inline-block">
          Return to homepage
        </Link>
      </div>
    );
  }

  // Format the publish date
  const publishDate = new Date(post.publishDate);
  const formattedDate = publishDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <Head>
        <title>{post.title} | Men's Health Finder</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={`${post.title} | Men's Health Finder`} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.featuredImage} />
        <meta property="og:type" content="article" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Featured image */}
        <div className="w-full relative aspect-[16/9] rounded-xl overflow-hidden mb-8">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Blog post header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map((category) => (
              <span 
                key={category} 
                className="bg-[#222222] text-white text-xs px-3 py-1 rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {post.title}
          </h1>
          
          <div className="flex items-center text-gray-400 mb-8">
            <span>{post.author}</span>
            <span className="mx-2">•</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Blog post content */}
        <div className="max-w-4xl mx-auto prose prose-invert prose-lg">
          <p className="font-medium text-xl mb-6 text-gray-200">
            {post.excerpt}
          </p>
          
          {/* For now, we're just displaying a placeholder since the mock data doesn't have full content */}
          <div>
            <p>
              This is a placeholder for the full blog post content. In a real implementation, this would contain the complete article with proper formatting, images, and other rich content elements.
            </p>
            <p>
              The excerpt for this article is: {post.excerpt}
            </p>
          </div>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="max-w-6xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link 
                  key={relatedPost.id} 
                  href={`/blog/${relatedPost.slug}`}
                  className="card overflow-hidden group"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden">
                    <img
                      src={relatedPost.featuredImage}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-gray-400 mb-2">
                      {new Date(relatedPost.publishDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                      {relatedPost.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate paths for all blog posts
  const paths = mockBlogPosts.map((post) => ({
    params: { slug: post.slug }}));

  return {
    paths,
    fallback: false, // Show 404 for any paths not returned by getStaticPaths
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const post = mockBlogPosts.find((post) => post.slug === slug);
  
  // Find related posts (same category, excluding current post)
  let relatedPosts: BlogPost[] = [];
  
  if (post) {
    // Get posts that share at least one category with the current post
    relatedPosts = mockBlogPosts
      .filter((p) => 
        p.id !== post.id && 
        p.categories.some((cat) => post.categories.includes(cat))
      )
      .slice(0, 3); // Limit to 3 related posts
  }

  return {
    props: {
      post: post || null,
      relatedPosts}};
};