"use client";

import AdvancedError from "@/components/shared/AdvancedError";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return <AdvancedError error={error} reset={reset} />;
}
