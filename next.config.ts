import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	reactCompiler: true,
	devIndicators: {
		position: "bottom-right"
	},
	typedRoutes: true,
	logging: {
		incomingRequests: true
	},
	experimental: {
		optimizeCss: true,
	},
};

export default nextConfig;
