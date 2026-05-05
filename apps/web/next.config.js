/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
  async redirects() {
    return [
      // V5: 废弃页面重定向到首页
      { source: '/reflect', destination: '/', permanent: false },
      { source: '/explore', destination: '/', permanent: false },
      { source: '/lenses', destination: '/', permanent: false },
      { source: '/lenses/build', destination: '/', permanent: false },
      { source: '/model', destination: '/progress', permanent: false },
    ];
  },
};

module.exports = nextConfig;
