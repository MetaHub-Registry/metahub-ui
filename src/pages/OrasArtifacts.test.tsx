import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { OrasArtifacts } from "./OrasArtifacts";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api");
  return {
    ...actual,
    fetchOrasArtifacts: vi.fn(),
  };
});

import { fetchOrasArtifacts } from "@/lib/api";
const mockFetchOrasArtifacts = vi.mocked(fetchOrasArtifacts);

describe("OrasArtifacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", async () => {
    mockFetchOrasArtifacts.mockResolvedValue({
      next: {},
      bread_crumbs: [],
      slug_end: 0,
    });

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras"] },
    });

    expect(screen.getByText("Artifacts")).toBeInTheDocument();
    expect(screen.getByText("Browse ORAS artifacts stored in the registry")).toBeInTheDocument();
  });

  it("renders artifact entries after loading", async () => {
    mockFetchOrasArtifacts.mockResolvedValue({
      next: {
        "application/vnd.cyclonedx": {
          repo: "qnib/featuretest",
          artifact_type: "application/vnd.cyclonedx",
          artifact_count: 2,
        },
      },
      bread_crumbs: [],
      slug_end: 1,
    });

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras/qnib/featuretest"] },
    });

    await waitFor(() => {
      expect(screen.getByText("application/vnd.cyclonedx")).toBeInTheDocument();
    });
  });

  it("renders namespace segments for tree navigation", async () => {
    mockFetchOrasArtifacts.mockResolvedValue({
      next: {
        qnib: {
          repo: "qnib",
          artifact_type: "",
          artifact_count: 5,
        },
      },
      bread_crumbs: [],
      slug_end: 0,
    });

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras"] },
    });

    await waitFor(() => {
      expect(screen.getByText("qnib")).toBeInTheDocument();
    });
  });

  it("filters items by search term", async () => {
    mockFetchOrasArtifacts.mockResolvedValue({
      next: {
        "application/vnd.cyclonedx": {
          repo: "qnib/featuretest",
          artifact_type: "application/vnd.cyclonedx",
          artifact_count: 1,
        },
        "application/vnd.spdx+json": {
          repo: "qnib/featuretest",
          artifact_type: "application/vnd.spdx+json",
          artifact_count: 1,
        },
      },
      bread_crumbs: [],
      slug_end: 1,
    });

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras/qnib/featuretest"] },
    });

    await waitFor(() => {
      expect(screen.getByText("application/vnd.cyclonedx")).toBeInTheDocument();
    });

    const filterInput = screen.getByPlaceholderText("Filter artifacts...");
    fireEvent.change(filterInput, { target: { value: "cyclonedx" } });

    expect(screen.getByText("application/vnd.cyclonedx")).toBeInTheDocument();
    expect(screen.queryByText("application/vnd.spdx+json")).not.toBeInTheDocument();
  });

  it("shows empty state when no artifacts match filter", async () => {
    mockFetchOrasArtifacts.mockResolvedValue({
      next: {
        "application/vnd.cyclonedx": {
          repo: "qnib/featuretest",
          artifact_type: "application/vnd.cyclonedx",
          artifact_count: 1,
        },
      },
      bread_crumbs: [],
      slug_end: 1,
    });

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras/qnib/featuretest"] },
    });

    await waitFor(() => {
      expect(screen.getByText("application/vnd.cyclonedx")).toBeInTheDocument();
    });

    const filterInput = screen.getByPlaceholderText("Filter artifacts...");
    fireEvent.change(filterInput, { target: { value: "nonexistent" } });

    expect(screen.getByText("No artifacts found")).toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    mockFetchOrasArtifacts.mockRejectedValue(new Error("Network error"));

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras"] },
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load ORAS artifacts")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("navigates to artifact detail when artifact-type card is clicked", async () => {
    mockFetchOrasArtifacts.mockResolvedValue({
      next: {
        "application/vnd.cyclonedx": {
          repo: "qnib/featuretest",
          artifact_type: "application/vnd.cyclonedx",
          artifact_count: 1,
        },
      },
      bread_crumbs: [],
      slug_end: 1,
    });

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras/qnib/featuretest"] },
    });

    await waitFor(() => {
      expect(screen.getByText("application/vnd.cyclonedx")).toBeInTheDocument();
    });

    // Click the artifact card — should trigger navigation to /oras/artifact
    fireEvent.click(screen.getByText("application/vnd.cyclonedx").closest("[class*='cursor-pointer']")!);
  });

  it("navigates deeper when namespace segment card is clicked", async () => {
    mockFetchOrasArtifacts.mockResolvedValue({
      next: {
        featuretest: {
          repo: "featuretest",
          artifact_type: "",
          artifact_count: 3,
        },
      },
      bread_crumbs: [],
      slug_end: 0,
    });

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras/qnib"] },
    });

    await waitFor(() => {
      expect(screen.getByText("featuretest")).toBeInTheDocument();
    });

    // Click the namespace card — should drill deeper
    const card = screen.getByText("featuretest").closest("[class*='cursor-pointer']")!;
    fireEvent.click(card);
  });

  it("shows reset search link when filter is active and no matches", async () => {
    mockFetchOrasArtifacts.mockResolvedValue({
      next: {
        "application/vnd.cyclonedx": {
          repo: "qnib/featuretest",
          artifact_type: "application/vnd.cyclonedx",
          artifact_count: 1,
        },
      },
      bread_crumbs: [],
      slug_end: 1,
    });

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras/qnib/featuretest"] },
    });

    await waitFor(() => screen.getByPlaceholderText("Filter artifacts..."));
    fireEvent.change(screen.getByPlaceholderText("Filter artifacts..."), {
      target: { value: "nonexistent" },
    });

    await waitFor(() => {
      expect(screen.getByText("reset search")).toBeInTheDocument();
    });

    // Click reset search — filter should clear
    fireEvent.click(screen.getByText("reset search"));
    await waitFor(() => {
      expect(screen.queryByText("reset search")).not.toBeInTheDocument();
    });
  });

  it("shows Unknown error when API rejects with non-Error", async () => {
    mockFetchOrasArtifacts.mockRejectedValue("string error");

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras"] },
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load ORAS artifacts")).toBeInTheDocument();
      expect(screen.getByText("Unknown error")).toBeInTheDocument();
    });
  });

  it("renders breadcrumbs when API returns them", async () => {
    mockFetchOrasArtifacts.mockResolvedValue({
      next: {},
      bread_crumbs: [
        { crumb: "qnib", active: 0, link: "qnib", tag: "", repo: "qnib", idx: 0 },
      ],
      slug_end: 0,
    });

    renderWithProviders(<OrasArtifacts />, {
      routerProps: { initialEntries: ["/oras/qnib"] },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
    });
  });
});
