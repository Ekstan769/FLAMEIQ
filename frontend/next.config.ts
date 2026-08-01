import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // This is required for static export 
  images: {
    unoptimized: true, //needs server for optimization, not yet here
  },
  trailingSlash: true, //keeps the path correct inside the shell
};

export default nextConfig;
