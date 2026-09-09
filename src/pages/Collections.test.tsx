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

  // ─── Name-based collection detail URLs (task 2.6) ───────────────
  // Clicking a tag navigates to /collections/<repo>/<tag> (name-based),
  // never the removed /collection/:id/tag/:tagId route. The profile
  // query string rides along, URL-encoded.
  function mockTagListing() {
    // At /collections (prefix ""): one repo entry carrying a tag →
    // rendered as a clickable tag card. Any deeper prefix behaves like
    // mockLeafResolution: full path empty, parent returns the leaf.
    mockFetchCollections.mockImplementation(
      async (
        repoPrefix: string
      ): Promise<CollectionListResponse> => {
        if (repoPrefix === "") {
          return {
            next: {
              ftest: {
                repo: "qnib/ftest",
                tag: "latest",
                collection_id: 34,
                tag_id: 31,
                collection_count: 1,
                manifest_count: 4,
              },
            },
            bread_crumbs: [],
            slug_end: "",
          };
        }
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

  it("navigates to the name-based URL when a tag is clicked", async () => {
    mockTagListing();
    mockFetchCollection.mockResolvedValue({
      collection: { name: "qnib/ftest", tag: "latest", manifests: [] },
      repos: [],
      bread_crumbs: [],
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections"] },
    });

    // Tag entries render as a "repo:tag" card title (split across spans).
    await waitFor(() => {
      expect(screen.getByText("qnib/ftest")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("qnib/ftest"));

    // The navigation must land on the name-based URL and trigger the
    // detail fetch by (repo, tag) — the /collection/:id route is gone.
    await waitFor(() => {
      expect(mockFetchCollection).toHaveBeenCalledWith(
        "qnib/ftest",
        "latest",
        undefined,
        undefined,
        ""
      );
    });
  });

  it("carries the profile query through navigation, URL-encoded", async () => {
    mockTagListing();
    mockFetchCollection.mockResolvedValue({
      collection: { name: "qnib/ftest", tag: "latest", manifests: [] },
      repos: [],
      bread_crumbs: [],
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections?profile=cpu%23zen2"] },
    });

    await waitFor(() => {
      expect(screen.getByText("qnib/ftest")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("qnib/ftest"));

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

  // ─── Manifest cards (task 3.4) ──────────────────────────────────
  // ManifestRow renders the API-provided `profiles` field as badges —
  // no client-side profile matching.
  it("renders profile badges from the API-provided profiles field", async () => {
    mockLeafResolution();
    mockFetchCollection.mockResolvedValue({
      collection: {
        name: "qnib/ftest",
        tag: "latest",
        manifests: [
          {
            digest: "sha256:withprofiles",
            media_type: "application/vnd.oci.image.manifest.v1+json",
            platform: { os: "linux", architecture: "amd64" },
            size: 100,
            registry: "",
            profiles: ["cpu#zen2", "cpu#zen3"],
          },
        ],
      },
      repos: [],
      bread_crumbs: [],
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections/qnib/ftest/latest"] },
    });

    await waitFor(() => {
      expect(screen.getByText("Profiles:")).toBeInTheDocument();
    });
    expect(screen.getByText("cpu#zen2")).toBeInTheDocument();
    expect(screen.getByText("cpu#zen3")).toBeInTheDocument();
  });

  it("omits the Profiles row when a manifest has none", async () => {
    mockLeafResolution();
    mockFetchCollection.mockResolvedValue({
      collection: {
        name: "qnib/ftest",
        tag: "latest",
        manifests: [
          {
            digest: "sha256:noprofiles",
            media_type: "application/vnd.oci.image.manifest.v1+json",
            platform: { os: "linux", architecture: "amd64" },
            size: 100,
            registry: "",
          },
        ],
      },
      repos: [],
      bread_crumbs: [],
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections/qnib/ftest/latest"] },
    });

    await waitFor(() => {
      expect(screen.getByText(/1 image/)).toBeInTheDocument();
    });
    expect(screen.queryByText("Profiles:")).not.toBeInTheDocument();
  });
});
