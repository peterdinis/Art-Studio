import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button component", () => {
	it("should render the button with correct text", () => {
		render(<Button>Click Me</Button>);
		expect(screen.getByText("Click Me")).toBeInTheDocument();
	});

	it("should call onClick when clicked", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click Me</Button>);
		fireEvent.click(screen.getByText("Click Me"));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("should be disabled when the disabled prop is passed", () => {
		render(<Button disabled>Disabled Button</Button>);
		expect(screen.getByRole("button")).toBeDisabled();
	});
});
