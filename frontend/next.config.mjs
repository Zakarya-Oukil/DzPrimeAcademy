// Hosts that next/image may fetch from: our own storage bucket and the stock photos already used by the
// built-in content. Anything else is refused (it used to allow every https host, an open image proxy).
const storageHost = (() => {
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  transpilePackages: ['framer-motion'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(storageHost ? [{ protocol: 'https', hostname: storageHost, pathname: '/storage/v1/object/public/**' }] : []),
    ],
  },
};

export default nextConfig;
