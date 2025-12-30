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
};

export default nextConfig;
