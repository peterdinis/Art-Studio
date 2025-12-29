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
		browserDebugInfoInTerminal: true
	},
};

export default nextConfig;
