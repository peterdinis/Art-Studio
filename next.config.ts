import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	reactCompiler: true,
	devIndicators: {
		position: "bottom-right",
	},

	typedRoutes: true,
	experimental: {
		optimizeCss: true,
		optimizePackageImports: ["lucide-react", "framer-motion", "zustand"],
		browserDebugInfoInTerminal: true,
	},
	images: {
		formats: ["image/webp"],
		deviceSizes: [640, 750, 828, 1080, 1200],
		imageSizes: [16, 32, 64, 96, 128, 256],
		minimumCacheTTL: 300,
	},
	poweredByHeader: false,
	generateEtags: true,
	compress: true,
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-DNS-Prefetch-Control",
						value: "on",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
					},
				],
			},
		];
	},
};

export default nextConfig;
