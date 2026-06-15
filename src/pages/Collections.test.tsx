import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Collections } from "./Collections";
import type { CollectionListResponse } from "@/lib/api";

// Mock API
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api");
  return {
    ...actual,
    fetchCollections: vi.fn(),
    fetchCollection: vi.fn(),
  };
});

import { fetchCollections, fetchCollection } from "@/lib/api";
const mockFetchCollections = vi.mocked(fetchCollections);
const mockFetchCollection = vi.mocked(fetchCollection);

describe("Collections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", async () => {
    mockFetchCollections.mockResolvedValue({
      next: {},
      bread_crumbs: [],
      slug_end: "",
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections"] },
    });

    expect(screen.getByText("Collections")).toBeInTheDocument();
    expect(
      screen.getByText("Browse container image collections")
    ).toBeInTheDocument();
  });

  it("renders loading skeletons initially", () => {
    // Don't resolve the promise to keep loading state
    mockFetchCollections.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections"] },
    });

    // Skeletons should be rendered (they have role="status" or generic divs)
    expect(screen.getByPlaceholderText("Filter collections...")).toBeInTheDocument();
  });

  it("displays collection items after loading", async () => {
    mockFetchCollections.mockResolvedValue({
      next: {
        qnib: {
          repo: "qnib",
          tag: "",
          collection_id: 0,
          tag_id: 0,
          collection_count: 5,
          manifest_count: 0,
        },
        biocontainers: {
          repo: "biocontainers",
          tag: "",
          collection_id: 0,
          tag_id: 0,
          collection_count: 12,
          manifest_count: 0,
        },
      },
      bread_crumbs: [],
      slug_end: "",
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections"] },
    });

    await waitFor(() => {
      expect(screen.getByText("qnib")).toBeInTheDocument();
      expect(screen.getByText("biocontainers")).toBeInTheDocument();
    });
  });

  it("shows collection count for namespaces", async () => {
    mockFetchCollections.mockResolvedValue({
      next: {
        qnib: {
          repo: "qnib",
          tag: "",
          collection_id: 0,
          tag_id: 0,
          collection_count: 5,
          manifest_count: 0,
        },
      },
      bread_crumbs: [],
      slug_end: "",
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections"] },
    });

    await waitFor(() => {
      expect(screen.getByText("5 collections")).toBeInTheDocument();
    });
  });

  it("shows image count badge for items with manifests", async () => {
    mockFetchCollections.mockResolvedValue({
      next: {
        latest: {
          repo: "qnib/featuretest",
          tag: "latest",
          collection_id: 0,
          tag_id: 0,
          collection_count: 0,
          manifest_count: 13,
        },
      },
      bread_crumbs: [],
      slug_end: "",
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections/qnib/featuretest"] },
    });

    await waitFor(() => {
      expect(screen.getByText("13 images")).toBeInTheDocument();
    });
  });

  it("filters items by search term", async () => {
    mockFetchCollections.mockResolvedValue({
      next: {
        qnib: {
          repo: "qnib",
          tag: "",
          collection_id: 0,
          tag_id: 0,
          collection_count: 5,
          manifest_count: 0,
        },
        biocontainers: {
          repo: "biocontainers",
          tag: "",
          collection_id: 0,
          tag_id: 0,
          collection_count: 12,
          manifest_count: 0,
        },
      },
      bread_crumbs: [],
      slug_end: "",
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections"] },
    });

    await waitFor(() => {
      expect(screen.getByText("qnib")).toBeInTheDocument();
    });

    const filterInput = screen.getByPlaceholderText("Filter collections...");
    fireEvent.change(filterInput, { target: { value: "qnib" } });

    expect(screen.getByText("qnib")).toBeInTheDocument();
    expect(screen.queryByText("biocontainers")).not.toBeInTheDocument();
  });

  it("shows empty state when no items match filter", async () => {
    mockFetchCollections.mockResolvedValue({
      next: {
        qnib: {
          repo: "qnib",
          tag: "",
          collection_id: 0,
          tag_id: 0,
          collection_count: 5,
          manifest_count: 0,
        },
      },
      bread_crumbs: [],
      slug_end: "",
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections"] },
    });

    await waitFor(() => {
      expect(screen.getByText("qnib")).toBeInTheDocument();
    });

    const filterInput = screen.getByPlaceholderText("Filter collections...");
    fireEvent.change(filterInput, { target: { value: "nonexistent" } });

    expect(screen.getByText("No collections found")).toBeInTheDocument();
    expect(screen.getByText("reset search")).toBeInTheDocument();
  });

  it("resets filter when 'reset search' is clicked", async () => {
    mockFetchCollections.mockResolvedValue({
      next: {
        qnib: {
          repo: "qnib",
          tag: "",
          collection_id: 0,
          tag_id: 0,
          collection_count: 5,
          manifest_count: 0,
        },
      },
      bread_crumbs: [],
      slug_end: "",
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections"] },
    });

    await waitFor(() => {
      expect(screen.getByText("qnib")).toBeInTheDocument();
    });

    const filterInput = screen.getByPlaceholderText("Filter collections...");
    fireEvent.change(filterInput, { target: { value: "nonexistent" } });

    expect(screen.getByText("No collections found")).toBeInTheDocument();

    fireEvent.click(screen.getByText("reset search"));

    expect(screen.getByText("qnib")).toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    mockFetchCollections.mockRejectedValue(new Error("Network error"));

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections"] },
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load collections")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("renders breadcrumbs when API returns them", async () => {
    mockFetchCollections.mockResolvedValue({
      next: {},
      bread_crumbs: [
        { crumb: "qnib", active: 1, link: "qnib", tag: "", repo: "qnib", idx: 0 },
      ],
      slug_end: "qnib",
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections/qnib"] },
    });

    await waitFor(() => {
      expect(screen.getByText("qnib")).toBeInTheDocument();
      expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
    });
  });

  // ─── Profile filter on the leaf (tag) detail view ───────────────
  // Reaching /collections/qnib/ftest/latest resolves to a tag, which
  // triggers the inline collection-detail view inside Collections.tsx.
  // That view must forward the selected profile to fetchCollection so
  // the SERVER filters the manifests (RepoGetOne). Regression for
  // "UI shows all manifests when filtered via profile".
  function mockLeafResolution() {
    // Full path (qnib/ftest/latest) returns empty -> triggers parent lookup.
    // Parent path (qnib/ftest) returns a `latest` leaf entry.
    mockFetchCollections.mockImplementation(
      async (
        repoPrefix: string,
        _profile?: string
      ): Promise<CollectionListResponse> => {
        if (repoPrefix === "qnib/ftest") {
          return {
            next: {
              latest: {
                repo: "qnib/ftest",
                tag: "latest",
                collection_id: 34,
                tag_id: 31,
                collection_count: 1,
                manifest_count: 4,
              },
            },
            bread_crumbs: [],
            slug_end: 1,
          };
        }
        return { next: {}, bread_crumbs: [], slug_end: "" };
      }
    );
  }

  it("forwards the selected profile to the detail fetch on a tag URL", async () => {
    mockLeafResolution();
    mockFetchCollection.mockResolvedValue({
      collection: { name: "qnib/ftest", tag: "latest", manifests: [] },
      repos: [],
      bread_crumbs: [],
    });

    renderWithProviders(<Collections />, {
      routerProps: {
        initialEntries: ["/collections/qnib/ftest/latest?profile=cpu%23zen2"],
      },
    });

    await waitFor(() => {
      expect(mockFetchCollection).toHaveBeenCalledWith(
        "qnib/ftest",
        "latest",
        undefined,
        undefined,
        "cpu#zen2"
      );
    });
  });

  it("renders only the server-filtered manifests on a tag URL", async () => {
    mockLeafResolution();
    // Server returns just the single zen2 manifest (already filtered).
    mockFetchCollection.mockResolvedValue({
      collection: {
        name: "qnib/ftest",
        tag: "latest",
        manifests: [
          {
            digest: "sha256:zen2only",
            media_type: "application/vnd.oci.image.manifest.v1+json",
            platform: { os: "linux", architecture: "amd64" },
            size: 100,
            registry: "",
            profiles: ["cpu#zen2"],
          },
        ],
      },
      repos: [],
      bread_crumbs: [],
    });

    renderWithProviders(<Collections />, {
      routerProps: {
        initialEntries: ["/collections/qnib/ftest/latest?profile=cpu%23zen2"],
      },
    });

    await waitFor(() => {
      // Exactly one image rendered, matching the server-filtered count.
      expect(
        screen.getByText(/1 image .*included in the/)
      ).toBeInTheDocument();
    });
  });
});
