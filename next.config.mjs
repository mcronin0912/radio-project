/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const isStaticExport = !!basePath;

const nextConfig = {
  ...(isStaticExport && { output: "export" }),
  ...(basePath && { basePath, assetPrefix: `${basePath}/` }),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  // Workaround for CSS not loading on client navigation (Next.js 14.2.x)
  webpack: (config, { dev }) => {
    if (dev) {
      config.plugins = config.plugins.filter(
        (plugin) => plugin.constructor.name !== "CssChunkingPlugin"
      );
    }
    return config;
  },
};

export default nextConfig;
