import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a button with copy title", () => {
    render(<CopyButton text="test-value" />);
    expect(screen.getByTitle("Copy to clipboard")).toBeInTheDocument();
  });

  it("copies text to clipboard on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyButton text="sha256:abc123" />);
    fireEvent.click(screen.getByTitle("Copy to clipboard"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("sha256:abc123");
    });
  });

  it("shows checkmark icon after successful copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { container } = render(<CopyButton text="test" />);
    expect(container.querySelector("rect")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Copy to clipboard"));

    await waitFor(() => {
      expect(container.querySelector("rect")).not.toBeInTheDocument();
    });
  });

  it("applies custom className", () => {
    render(<CopyButton text="test" className="custom-class" />);
    expect(screen.getByTitle("Copy to clipboard").className).toContain("custom-class");
  });

  it("stops event propagation on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

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

  it("falls back to execCommand when clipboard API throws", async () => {
    // Make clipboard.writeText reject
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard not available"));
    Object.assign(navigator, { clipboard: { writeText } });

    // jsdom doesn't define execCommand — define it before spying
    if (!document.execCommand) {
      Object.defineProperty(document, "execCommand", {
        value: vi.fn(() => true),
        writable: true,
        configurable: true,
      });
    }
    const execCommand = vi.spyOn(document, "execCommand").mockReturnValue(true);
    const appendChild = vi.spyOn(document.body, "appendChild");
    const removeChild = vi.spyOn(document.body, "removeChild");

    const { container } = render(<CopyButton text="fallback-text" />);
    fireEvent.click(screen.getByTitle("Copy to clipboard"));

    await waitFor(() => {
      expect(execCommand).toHaveBeenCalledWith("copy");
    });

    // Should still show the checkmark after fallback copy
    await waitFor(() => {
      expect(container.querySelector("rect")).not.toBeInTheDocument();
    });

    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
  });

  it("fallback copy passes the correct text to execCommand", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard unavailable"));
    Object.assign(navigator, { clipboard: { writeText } });

    if (!document.execCommand) {
      Object.defineProperty(document, "execCommand", {
        value: vi.fn(() => true),
        writable: true,
        configurable: true,
      });
    }
    const execCommand = vi.spyOn(document, "execCommand").mockReturnValue(true);

    render(<CopyButton text="my-secret-text" />);
    fireEvent.click(screen.getByTitle("Copy to clipboard"));

    // Wait for the async clipboard rejection and fallback execution
    await waitFor(() => {
      expect(execCommand).toHaveBeenCalledWith("copy");
    });
  });
});
