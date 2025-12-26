"use client";

import { FC } from "react";

export const PhotoshopLoading: FC = () => {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1e1e]/95 backdrop-blur-sm">
			<div className="relative">
				{/* Photoshop icon animation */}
				<div className="relative w-32 h-32 mb-8">
					{/* Outer square */}
					<div className="absolute inset-0 border-2 border-[#404040] rounded-lg bg-linear-to-br from-[#2a2a2a] to-[#1e1e1e]">
						{/* Inner square animation */}
						<div className="absolute inset-4 border-2 border-[#31a8ff]/30 rounded animate-pulse" />

						{/* Animated bars */}
						<div className="absolute top-4 left-4 right-4 h-1 bg-[#404040] rounded overflow-hidden">
							<div className="h-full bg-linear-to-r from-transparent via-[#31a8ff] to-transparent animate-progress" />
						</div>

						<div className="absolute bottom-4 left-4 right-4 h-1 bg-[#404040] rounded overflow-hidden">
							<div
								className="h-full bg-linear-to-r from-transparent via-[#1473e6] to-transparent animate-progress"
								style={{ animationDelay: "0.5s" }}
							/>
						</div>

						{/* Ps letters */}
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="relative">
								<span className="text-4xl font-bold text-white/80">P</span>
								<span className="text-4xl font-bold text-[#31a8ff]">s</span>
								<div className="absolute -right-2 -top-2 w-4 h-4 bg-[#31a8ff] rounded-full animate-ping" />
							</div>
						</div>
					</div>

					{/* Rotating corners */}
					<div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#31a8ff] rounded-tl-lg animate-spin" />
					<div
						className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#1473e6] rounded-tr-lg animate-spin"
						style={{ animationDelay: "0.5s" }}
					/>
					<div
						className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#31a8ff] rounded-bl-lg animate-spin"
						style={{ animationDelay: "1s" }}
					/>
					<div
						className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#1473e6] rounded-br-lg animate-spin"
						style={{ animationDelay: "1.5s" }}
					/>
				</div>

				{/* Loading text */}
				<div className="text-center">
					<h3 className="text-xl font-medium text-white mb-2">ArtStudio Pro</h3>
					<p className="text-sm text-[#b0b0b0] mb-4">
						Loading creative workspace...
					</p>

					{/* Photoshop-like progress dots */}
					<div className="flex justify-center gap-2">
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className="w-2 h-2 bg-linear-to-b from-[#31a8ff] to-[#1473e6] rounded-full animate-pulse"
								style={{ animationDelay: `${i * 0.1}s` }}
							/>
						))}
					</div>

					{/* Loading modules */}
					<div className="mt-6 grid grid-cols-3 gap-2">
						{["Tools", "Brushes", "Layers", "Filters", "Colors", "History"].map(
							(module, i) => (
								<div
									key={module}
									className="px-2 py-1 bg-[#2a2a2a] border border-[#404040] rounded text-xs text-[#b0b0b0] text-center animate-fade-in"
									style={{ animationDelay: `${i * 0.1}s` }}
								>
									{module}
								</div>
							),
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default PhotoshopLoading;
