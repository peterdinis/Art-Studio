"use client";

import { useState } from "react";

export function useErrorHandler() {
	const [error, setError] = useState<Error | null>(null);

	const handleError = (err: unknown) => {
		const errorObj = err instanceof Error ? err : new Error(String(err));
		setError(errorObj);

		return errorObj;
	};

	const resetError = () => {
		setError(null);
	};

	return {
		error,
		handleError,
		resetError,
		hasError: !!error,
	};
}
