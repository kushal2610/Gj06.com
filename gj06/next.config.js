/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any domain
  images: {
    domains: [],
    unoptimized: true,
  },
}

module.exports = nextConfig