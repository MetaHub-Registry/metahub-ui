import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Collections } from "./Collections";

// Mock API
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api");
  return {
    ...actual,
    fetchCollections: vi.fn(),
  };
});

import { fetchCollections } from "@/lib/api";
const mockFetchCollections = vi.mocked(fetchCollections);

describe("Collections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", async () => {
    mockFetchCollections.mockResolvedValue({
      next: {},
      breadcrumbs: [],
      slug: "",
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
          col_id: "",
          tag_id: "",
          col_count: 5,
          mani_count: 0,
        },
        biocontainers: {
          repo: "biocontainers",
          tag: "",
          col_id: "",
          tag_id: "",
          col_count: 12,
          mani_count: 0,
        },
      },
      breadcrumbs: [],
      slug: "",
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
          col_id: "",
          tag_id: "",
          col_count: 5,
          mani_count: 0,
        },
      },
      breadcrumbs: [],
      slug: "",
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
          col_id: "col-1",
          tag_id: "tag-1",
          col_count: 0,
          mani_count: 13,
        },
      },
      breadcrumbs: [],
      slug: "",
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
          col_id: "",
          tag_id: "",
          col_count: 5,
          mani_count: 0,
        },
        biocontainers: {
          repo: "biocontainers",
          tag: "",
          col_id: "",
          tag_id: "",
          col_count: 12,
          mani_count: 0,
        },
      },
      breadcrumbs: [],
      slug: "",
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
          col_id: "",
          tag_id: "",
          col_count: 5,
          mani_count: 0,
        },
      },
      breadcrumbs: [],
      slug: "",
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
          col_id: "",
          tag_id: "",
          col_count: 5,
          mani_count: 0,
        },
      },
      breadcrumbs: [],
      slug: "",
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
      breadcrumbs: [
        { crumb: "qnib", active: true, link: "qnib", tag: "", repo: "qnib", idx: 0 },
      ],
      slug: "qnib",
    });

    renderWithProviders(<Collections />, {
      routerProps: { initialEntries: ["/collections/qnib"] },
    });

    await waitFor(() => {
      expect(screen.getByText("qnib")).toBeInTheDocument();
      expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
    });
  });
});
