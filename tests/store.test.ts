import { describe, it, expect, beforeEach } from "vitest";
import { useArtStudioStore } from "@/stores/artStudioStore";

describe("useArtStudioStore", () => {
	beforeEach(() => {
		// Reset store state before each test if possible,
		// though Zustand's state persists between tests in Vitest.
		// For simplicity, we manually reset key state.
		const { setActiveTool, setPrimaryColor, clearHistory } =
			useArtStudioStore.getState();
		setActiveTool("brush");
		setPrimaryColor("#ffffff");
		clearHistory();
	});

	it("should update active tool", () => {
		const { setActiveTool } = useArtStudioStore.getState();
		setActiveTool("pencil");
		expect(useArtStudioStore.getState().activeTool).toBe("pencil");
	});

	it("should swap primary and secondary colors", () => {
		const { setPrimaryColor, setSecondaryColor, swapColors } =
			useArtStudioStore.getState();
		setPrimaryColor("#ff0000");
		setSecondaryColor("#0000ff");
		swapColors();
		expect(useArtStudioStore.getState().primaryColor).toBe("#0000ff");
		expect(useArtStudioStore.getState().secondaryColor).toBe("#ff0000");
	});

	it("should add/remove layers correctly", () => {
		const { addLayer, removeLayer } = useArtStudioStore.getState();
		const initialCount = useArtStudioStore.getState().layers.length;

		addLayer();
		expect(useArtStudioStore.getState().layers.length).toBe(initialCount + 1);

		const newLayerId = useArtStudioStore.getState().layers[0].id;
		removeLayer(newLayerId);
		expect(useArtStudioStore.getState().layers.length).toBe(initialCount);
	});

	it("should handle history (add/undo/redo)", () => {
		const { addToHistory, undo, redo, canUndo, canRedo } =
			useArtStudioStore.getState();

		addToHistory("data-1", "thumb-1", "action-1");
		addToHistory("data-2", "thumb-2", "action-2");

		expect(canUndo()).toBe(true);

		undo();
		expect(useArtStudioStore.getState().historyIndex).toBe(0);
		expect(canRedo()).toBe(true);

		redo();
		expect(useArtStudioStore.getState().historyIndex).toBe(1);
	});

	it("should constrain zoom level within 10-500", () => {
		const { setZoom } = useArtStudioStore.getState();

		setZoom(5);
		expect(useArtStudioStore.getState().zoom).toBe(10);

		setZoom(1000);
		expect(useArtStudioStore.getState().zoom).toBe(500);

		setZoom(150);
		expect(useArtStudioStore.getState().zoom).toBe(150);
	});
});
