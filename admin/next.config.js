/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["uploadthing.com", "utfs.io", "i.imgur.com"],
  },
};

module.exports = nextConfig;
