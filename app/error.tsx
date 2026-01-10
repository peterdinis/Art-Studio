"use client";

import ErrorComponent from "@/components/shared/PhotoshopError";

export default function Error() {
	return (
		<ErrorComponent
			title="ArtStudio Error"
			description="Layer composition failed. Please try again."
			variant="photoshop"
			autoResetDuration={3000}
		/>
	);
}
