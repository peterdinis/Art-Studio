import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

describe("UI Primitives", () => {
	describe("Input component", () => {
		it("should render correctly", () => {
			render(<Input placeholder="Enter text" />);
			expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
		});

		it("should be disabled when the disabled prop is passed", () => {
			render(<Input disabled />);
			expect(screen.getByRole("textbox")).toBeDisabled();
		});
	});

	describe("Label component", () => {
		it("should render correctly", () => {
			render(<Label>Test Label</Label>);
			expect(screen.getByText("Test Label")).toBeInTheDocument();
		});
	});
});
