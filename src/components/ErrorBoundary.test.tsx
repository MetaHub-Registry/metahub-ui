import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

// A component that throws on render
function ThrowingComponent({ message }: { message: string }): React.ReactNode {
  throw new Error(message);
}

// Suppress console.error for expected errors in tests
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <p>Everything is fine</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("Everything is fine")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Boom!" />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Boom!")).toBeInTheDocument();
  });

  it("renders the 'Try again' button", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Test error" />
      </ErrorBoundary>
    );
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<p>Custom fallback</p>}>
        <ThrowingComponent message="Test error" />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("recovers when 'Try again' is clicked and child no longer throws", () => {
    let shouldThrow = true;

    function MaybeThrow() {
      if (shouldThrow) {
        throw new Error("Temporary error");
      }
      return <p>Recovered</p>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Fix the issue
    shouldThrow = false;

    // Click "Try again"
    fireEvent.click(screen.getByText("Try again"));

    // Should attempt to re-render children
    // Since shouldThrow is now false, it should show "Recovered"
    rerender(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText("Recovered")).toBeInTheDocument();
  });
});
