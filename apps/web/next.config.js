/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude worker app from build
  transpilePackages: [],
  experimental: {
    externalDir: true,
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  // Handle Node.js specific modules for client-side
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to load these server-only modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
        querystring: false,
      };
    }
    
    // Exclude leaflet CSS from static imports to prevent build errors
    // These will be loaded dynamically at runtime instead
    config.module.rules.push({
      test: /leaflet.*\.css$/,
      loader: 'ignore-loader',
      include: /node_modules/,
    });

    return config;
  },
};

module.exports = nextConfig;