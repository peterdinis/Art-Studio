import type { Metadata, Viewport } from "next";
import { Inter, Ubuntu } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/shared/ScrollToTop";

const ubuntu = Ubuntu({
	variable: "--font-ubuntu",
	subsets: ["latin", "latin-ext"],
	weight: ["300", "400", "500", "700"],
	display: "swap",
	preload: true,
});

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	minimumScale: 1,
	viewportFit: "cover",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0f172a" },
	],
	colorScheme: "dark light",
};

export const metadata: Metadata = {
	title: {
		default: "ArtStudio Pro | Advanced Online Photo Editor",
		template: "%s | ArtStudio Pro",
	},
	description:
		"Professional-grade online photo editor and graphic design tool. Free Photoshop alternative with layers, filters, brushes, and AI-powered editing tools. Create stunning visuals directly in your browser.",
	keywords: [
		"online photoshop",
		"photo editor",
		"graphic design",
		"image editing",
		"photoshop alternative",
		"free photo editor",
		"web-based design tool",
		"layer editing",
		"digital art",
		"photo manipulation",
		"AI photo editing",
		"collage maker",
		"photo filters",
		"brushes",
		"vector graphics",
	],
	authors: [{ name: "ArtStudio Team" }],
	creator: "ArtStudio Pro",
	publisher: "ArtStudio",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL("https://artstudio.pro"),
	alternates: {
		canonical: "/",
		languages: {
			"en-US": "/en-US",
			"sk-SK": "/sk-SK",
			"cs-CZ": "/cs-CZ",
		},
	},

	// Open Graph
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://artstudio.pro",
		title: "ArtStudio Pro | Free Online Photo Editor",
		description:
			"Professional photo editing tool in your browser. No downloads required.",
		siteName: "ArtStudio Pro",
	},

	// Robots
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},

	// Other
	category: "design",
	classification: "Graphic Design Software",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			suppressContentEditableWarning
			className={`${ubuntu.variable}`}
		>
			<head>
				{/* Preconnect for external resources */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>

				{/* Structured Data for SEO */}
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "SoftwareApplication",
							name: "ArtStudio Pro",
							applicationCategory: "DesignApplication",
							operatingSystem: "Web Browser",
							description:
								"Professional online photo editor and graphic design tool",
							url: "https://artstudio.pro",
							offers: {
								"@type": "Offer",
								price: "0",
								priceCurrency: "USD",
							},
							aggregateRating: {
								"@type": "AggregateRating",
								ratingValue: "4.8",
								ratingCount: "1247",
							},
							featureList: [
								"Layer-based editing",
								"AI-powered tools",
								"Advanced filters",
								"Brush engine",
								"Vector graphics",
								"Text tools",
								"Export multiple formats",
							],
						}),
					}}
				/>
			</head>
			<body
				className={`${ubuntu.variable} font-sans antialiased bg-background text-foreground`}
			>
				{/* Main content */}
				<main className="min-h-screen overflow-hidden">
					{children}
					<ScrollToTop />
				</main>
			</body>
		</html>
	);
}
