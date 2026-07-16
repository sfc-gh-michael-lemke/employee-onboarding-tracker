import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "mammoth", "xlsx"],
  webpack: (config) => {
    // pdfjs-dist tries to require('canvas') for server-side rendering paths — suppress it
    config.resolve.alias = { ...config.resolve.alias, canvas: false }
    return config
  },
}

export default nextConfig
