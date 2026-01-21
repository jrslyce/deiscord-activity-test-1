/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  turbopack: {
    // Helps monorepo setups so Next doesn't infer the wrong workspace root.
    root: __dirname,
  },
};

module.exports = nextConfig;
