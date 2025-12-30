import type { NextConfig } from "next";

// next-pwa masih expose CommonJS, jadi pakai require di TS config
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,

  // penting: jangan aktifkan SW saat development (turbopack/dev sering bikin pusing)
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // ✅ silence turbopack+webpack config warning
  turbopack: {},
};

export default withPWA(nextConfig);
;
