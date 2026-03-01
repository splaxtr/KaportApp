import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  cacheOnFrontEndNav: false,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default withPWA(nextConfig);
