/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdf.js uses canvas as optional dependency — tell webpack to ignore it
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
