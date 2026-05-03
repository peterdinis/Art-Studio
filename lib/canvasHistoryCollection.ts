import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";

/**
 * Reactive canvas undo/redo frames for History UI (@tanstack/react-db live queries).
 * Zustand remains authoritative for undo index + linear timeline; this mirrors frames.
 */
export type CanvasHistoryFrame = {
	id: string;
	canvasData: string;
	thumbnail: string | null;
	timestamp: number;
	action?: string;
};

/** Loose shape when hydrating from Zustand snapshots */
export type HistoryEntryLike = {
	id?: string;
	canvasData: string;
	thumbnail: string | null;
	timestamp: number;
	action?: string;
};

function randomRowId(): string {
	return typeof globalThis !== "undefined" &&
		globalThis.crypto &&
		typeof globalThis.crypto.randomUUID === "function"
		? globalThis.crypto.randomUUID()
		: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const canvasHistoryCollection = createCollection(
	localOnlyCollectionOptions<CanvasHistoryFrame>({
		id: "artstudio-canvas-history",
		getKey: (row) => row.id,
	}),
);

export function deleteAllCanvasHistoryFrames(): void {
	const keys = [...canvasHistoryCollection.keys()];
	if (keys.length > 0) {
		canvasHistoryCollection.delete(keys);
	}
}

/** Full rebuild — e.g. hydrate from Zustand after tests / hot reload */
export function replaceCanvasHistoryFrames(entries: HistoryEntryLike[]): void {
	deleteAllCanvasHistoryFrames();
	for (const e of entries) {
		const id = e.id ?? randomRowId();
		canvasHistoryCollection.insert({
			id,
			canvasData: e.canvasData,
			thumbnail: e.thumbnail ?? null,
			timestamp: e.timestamp,
			action: e.action,
		});
	}
}
