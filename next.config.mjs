/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "X-Robots-Tag",
              value: "noai, noimageai",
            },
          ],
        },
      ];
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "novel-index-strapi.onrender.com",
        },
        {
          protocol: "https",
          hostname: "res.cloudinary.com",
        },
        {
          protocol: "https",
          hostname: "**.amazonaws.com",
        },
      ],
    },
  };

  export default nextConfig;
  