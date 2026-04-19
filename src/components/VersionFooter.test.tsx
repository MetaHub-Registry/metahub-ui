import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { VersionFooter } from "./VersionFooter";
import { renderWithProviders, createTestQueryClient } from "@/test/test-utils";

// Mock the API fetcher — the real one calls fetch() which we'd
// otherwise have to stub globally. Inline mock keeps the setup local.
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    fetchVersion: vi.fn(),
  };
});

import { fetchVersion } from "@/lib/api";
const mockFetch = vi.mocked(fetchVersion);

describe("VersionFooter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders all three versions when the endpoint responds", async () => {
    mockFetch.mockResolvedValue({ api: "3.1.0-dev2", metalib: "3.2.0-dev2" });
    renderWithProviders(<VersionFooter uiVersion="7.0.0-dev1" />, {
      queryClient: createTestQueryClient(),
    });
    // Wait for the query to resolve before asserting on api/metalib.
    await waitFor(() => {
      const footer = screen.getByTestId("version-footer");
      expect(footer.textContent).toContain("api v3.1.0-dev2");
    });
    const footer = screen.getByTestId("version-footer");
    expect(footer.textContent).toContain("ui v7.0.0-dev1");
    expect(footer.textContent).toContain("api v3.1.0-dev2");
    expect(footer.textContent).toContain("metalib v3.2.0-dev2");
  });

  it("falls back to an em-dash when the endpoint returns empty strings", async () => {
    mockFetch.mockResolvedValue({ api: "", metalib: "" });
    renderWithProviders(<VersionFooter uiVersion="7.0.0" />, {
      queryClient: createTestQueryClient(),
    });
    await waitFor(() => {
      const footer = screen.getByTestId("version-footer");
      expect(footer.textContent).toContain("api v—");
    });
    const footer = screen.getByTestId("version-footer");
    // The UI version still renders from the prop (it's never empty
    // because __APP_VERSION__ is injected at build time).
    expect(footer.textContent).toContain("ui v7.0.0");
    expect(footer.textContent).toContain("metalib v—");
  });

  it("falls back to em-dash while the query is pending / errored", async () => {
    // Rejected promise — react-query surfaces that as data=undefined
    // with retry disabled. The component must still render both
    // em-dashes without crashing the layout.
    mockFetch.mockRejectedValue(new Error("network down"));
    renderWithProviders(<VersionFooter uiVersion="7.0.0" />, {
      queryClient: createTestQueryClient(),
    });
    const footer = screen.getByTestId("version-footer");
    // Initial render (data still undefined) already shows the fallback.
    expect(footer.textContent).toContain("ui v7.0.0");
    expect(footer.textContent).toContain("api v—");
    expect(footer.textContent).toContain("metalib v—");
  });
});
