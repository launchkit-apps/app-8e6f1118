/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone output for multitenant compatibility
  experimental: {
    appDir: true,
  },
  // Disable telemetry for cleaner logs
  telemetry: false,
}

module.exports = nextConfig