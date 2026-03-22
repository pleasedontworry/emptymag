import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mpvape.shop",
      },
      {
        protocol: "https",
        hostname: "cloud-candy.com.ua",
      },
      {
        protocol: "https",
        hostname: "vapehydra.in.ua",
      },
      {
        protocol: "https",
        hostname: "ibb.com",
      },

      // IMGUR
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },

      // POSTIMAGES
      {
        protocol: "https",
        hostname: "i.postimg.cc",
      },

      // IMGBB
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },

      {
        protocol: "https",
        hostname: "ibb.co",
      },

      {
        protocol: "https",
        hostname: "postimg.cc",
      },
    ],
  },
};

export default nextConfig;