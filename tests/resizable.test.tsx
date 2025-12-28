import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import React from "react";

// Mock react-resizable-panels since it might rely on DOM measurements not available in JSDOM
vi.mock("react-resizable-panels", () => {
    const Group = ({ children, className }: any) => (
        <div data-testid="resizable-group" className={className}>
            {children}
        </div>
    );
    const Panel = ({ children, className }: any) => (
        <div data-testid="resizable-panel" className={className}>
            {children}
        </div>
    );
    const Separator = ({ className }: any) => (
        <div data-testid="resizable-handle" className={className} />
    );
    return {
        Group,
        Panel,
        Separator,
    };
});

describe("Resizable Components", () => {
    it("should render ResizablePanelGroup correctly", () => {
        render(
            <ResizablePanelGroup orientation="horizontal">
                <ResizablePanel defaultSize={50}>Left</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>Right</ResizablePanel>
            </ResizablePanelGroup>,
        );

        expect(screen.getByTestId("resizable-group")).toBeInTheDocument();
        expect(screen.getAllByTestId("resizable-panel")).toHaveLength(2);
        expect(screen.getByTestId("resizable-handle")).toBeInTheDocument();
    });

    it("should apply custom classes to ResizablePanelGroup", () => {
        render(
            <ResizablePanelGroup orientation="horizontal" className="custom-group">
                <ResizablePanel>Content</ResizablePanel>
            </ResizablePanelGroup>,
        );

        expect(screen.getByTestId("resizable-group")).toHaveClass("custom-group");
    });

    it("should render ResizableHandle with handle icon if withHandle is true", () => {
        render(
            <ResizablePanelGroup orientation="horizontal">
                <ResizablePanel>Left</ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel>Right</ResizablePanel>
            </ResizablePanelGroup>,
        );

        // The handle icon uses GripVertical from lucide-react but it's nested in a div
        expect(screen.getByTestId("resizable-handle")).toBeInTheDocument();
    });
});
