/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — no Node server needed. Deploy the `out/` folder anywhere
  // (GitHub Pages, Vercel, Netlify, S3...). All data comes from the Supabase
  // edge functions at runtime, client-side.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // For GitHub Pages project sites (https://user.github.io/<repo>/), set
  // NEXT_PUBLIC_BASE_PATH=/<repo> at build time. The included GitHub Actions
  // workflow does this automatically. Leave empty for Vercel/Netlify/root.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;
