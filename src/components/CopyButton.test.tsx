import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a button with copy title", () => {
    render(<CopyButton text="test-value" />);
    expect(screen.getByTitle("Copy to clipboard")).toBeInTheDocument();
  });

  it("copies text to clipboard on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyButton text="sha256:abc123" />);
    fireEvent.click(screen.getByTitle("Copy to clipboard"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("sha256:abc123");
    });
  });

  it("shows checkmark icon after successful copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const { container } = render(<CopyButton text="test" />);

    // Before click: should have a rect element (copy icon)
    expect(container.querySelector("rect")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Copy to clipboard"));

    // After click: should show checkmark path (no rect)
    await waitFor(() => {
      expect(container.querySelector("rect")).not.toBeInTheDocument();
    });
  });

  it("applies custom className", () => {
    render(<CopyButton text="test" className="custom-class" />);
    const button = screen.getByTitle("Copy to clipboard");
    expect(button.className).toContain("custom-class");
  });

  it("stops event propagation on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const parentHandler = vi.fn();
    render(
      <div onClick={parentHandler}>
        <CopyButton text="test" />
      </div>
    );

    fireEvent.click(screen.getByTitle("Copy to clipboard"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(parentHandler).not.toHaveBeenCalled();
  });
});
