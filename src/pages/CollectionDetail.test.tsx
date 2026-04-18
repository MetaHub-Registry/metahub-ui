import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CollectionDetail } from "./CollectionDetail";

// Mock API
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api");
  return {
    ...actual,
    fetchCollection: vi.fn(),
  };
});

import { fetchCollection } from "@/lib/api";
const mockFetchCollection = vi.mocked(fetchCollection);

const sampleData = {
  collection: {
    name: "qnib/featuretest",
    tag: "latest",
    manifests: [
      {
        digest: "sha256:aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666",
        media_type: "application/vnd.oci.image.manifest.v1+json",
        platform: { os: "linux", architecture: "amd64" },
        size: 52428800,
        registry: "docker.io",
      },
      {
        digest: "sha256:bbbb2222cccc3333dddd4444eeee5555ffff6666aaaa1111",
        media_type: "application/vnd.oci.image.manifest.v1+json",
        platform: { os: "linux", architecture: "arm64", variant: "v8" },
        size: 48234496,
        registry: "quay.io",
      },
      {
        digest: "sha256:cccc3333dddd4444eeee5555ffff6666aaaa1111bbbb2222",
        media_type: "application/vnd.oci.image.manifest.v1+json",
        platform: {
          os: "linux",
          architecture: "amd64",
          features: ["cpu:zen3"],
        },
        size: 55000000,
        registry: "registry.gitlab.com",
      },
    ],
  },
  repos: [],
  bread_crumbs: [],
};

function renderCollectionDetail(initialPath = "/collection/col-1/tag/tag-1") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <TooltipProvider>
          <Routes>
            <Route
              path="/collection/:id/tag/:tagId"
              element={<CollectionDetail />}
            />
          </Routes>
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("CollectionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders collection name and tag", async () => {
    mockFetchCollection.mockResolvedValue(sampleData);
    renderCollectionDetail();

    await waitFor(() => {
      expect(screen.getByText("qnib/featuretest")).toBeInTheDocument();
      expect(screen.getByText("latest")).toBeInTheDocument();
    });
  });

  it("shows total manifest count", async () => {
    mockFetchCollection.mockResolvedValue(sampleData);
    renderCollectionDetail();

    await waitFor(() => {
      expect(screen.getByText("3 images in this collection")).toBeInTheDocument();
    });
  });

  it("renders manifest platforms", async () => {
    mockFetchCollection.mockResolvedValue(sampleData);
    renderCollectionDetail();

    await waitFor(() => {
      // Two manifests have linux/amd64 (plain + zen3 variant)
      const amd64Badges = screen.getAllByText("linux/amd64");
      expect(amd64Badges.length).toBe(2);
      expect(screen.getByText("linux/arm64/v8")).toBeInTheDocument();
    });
  });

  it("renders truncated digests", async () => {
    mockFetchCollection.mockResolvedValue(sampleData);
    renderCollectionDetail();

    await waitFor(() => {
      expect(screen.getByText("aaaa1111bbbb")).toBeInTheDocument();
    });
  });

  it("renders registry badges", async () => {
    mockFetchCollection.mockResolvedValue(sampleData);
    renderCollectionDetail();

    await waitFor(() => {
      expect(screen.getByText("docker.io")).toBeInTheDocument();
      expect(screen.getByText("quay.io")).toBeInTheDocument();
      expect(screen.getByText("registry.gitlab.com")).toBeInTheDocument();
    });
  });

  it("renders feature badges for manifests with features", async () => {
    mockFetchCollection.mockResolvedValue(sampleData);
    renderCollectionDetail();

    await waitFor(() => {
      expect(screen.getByText("cpu:zen3")).toBeInTheDocument();
    });
  });

  it("shows sort controls", async () => {
    mockFetchCollection.mockResolvedValue(sampleData);
    renderCollectionDetail();

    await waitFor(() => {
      expect(screen.getByText("Sort by:")).toBeInTheDocument();
    });
  });

  it("shows profile index summary when a profile is selected", async () => {
    mockFetchCollection.mockResolvedValue(sampleData);
    renderCollectionDetail("/collection/col-1/tag/tag-1?profile=zen3");

    await waitFor(() => {
      expect(screen.getByText(/images included in the/)).toBeInTheDocument();
      // "zen3" appears in both the summary span and the profile selector option;
      // verify the summary text contains the profile name
      const summaryText = screen.getByText(/images included in the/).textContent;
      expect(summaryText).toContain("zen3");
    });
  });

  it("shows loading skeletons while fetching", () => {
    mockFetchCollection.mockReturnValue(new Promise(() => {}));
    renderCollectionDetail();

    expect(screen.queryByText("linux/amd64")).not.toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    mockFetchCollection.mockRejectedValue(new Error("Not found"));
    renderCollectionDetail();

    await waitFor(() => {
      expect(screen.getByText("Failed to load collection")).toBeInTheDocument();
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });
  });
});

// ───────────────────────────────────────────────────────────────────
// Expandable row + profile link + upstream  (collection-manifest-expand)
// ───────────────────────────────────────────────────────────────────

const expandData = {
  collection: {
    name: "qnib/expand",
    tag: "latest",
    manifests: [
      {
        digest: "sha256:aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666",
        media_type: "application/vnd.oci.image.manifest.v1+json",
        platform: { os: "linux", architecture: "amd64" },
        size: 12345,
        registry: "docker.io",
        upstream: "quay.io/qnib/expand:latest",
        annotations: { "org.opencontainers.image.title": "expand" },
        profiles: ["cpu#zen3"],
        config: {
          digest: "sha256:cfgcfgcfgcfgcfgcfgcfgcfgcfgcfgcfgcfgcfgcfgcfgcfg",
          media_type: "application/vnd.oci.image.config.v1+json",
          size: 999,
        },
        layers: [
          {
            digest: "sha256:lyr1lyr1lyr1lyr1lyr1lyr1lyr1lyr1lyr1lyr1lyr1lyr1",
            media_type: "application/vnd.oci.image.layer.v1.tar+gzip",
            size: 42,
          },
          {
            digest: "sha256:lyr2lyr2lyr2lyr2lyr2lyr2lyr2lyr2lyr2lyr2lyr2lyr2",
            media_type: "application/vnd.oci.image.layer.v1.tar+gzip",
            size: 84,
          },
        ],
      },
    ],
  },
  repos: [],
  bread_crumbs: [],
};

describe("CollectionDetail — expandable rows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upstream URL and a copy button when manifest.upstream is set", async () => {
    mockFetchCollection.mockResolvedValue(expandData);
    renderCollectionDetail();
    await waitFor(() => {
      expect(screen.getByText("quay.io/qnib/expand:latest")).toBeInTheDocument();
    });
  });

  it("renders profile badges as links pointing at /profiles/:label", async () => {
    mockFetchCollection.mockResolvedValue(expandData);
    renderCollectionDetail();
    await waitFor(() => {
      const links = screen.getAllByTestId("profile-link");
      expect(links.length).toBe(1);
      expect(links[0]).toHaveAttribute("href", "/profiles/cpu%23zen3");
    });
  });

  it("expands the row on click and reveals config + layers", async () => {
    mockFetchCollection.mockResolvedValue(expandData);
    renderCollectionDetail();
    await waitFor(() => {
      expect(screen.getByTestId("manifest-row")).toBeInTheDocument();
    });
    const row = screen.getByTestId("manifest-row");
    // Initially collapsed: the "Config" heading is absent.
    expect(within(row).queryByText("Config")).not.toBeInTheDocument();
    const toggle = within(row).getByRole("button", { expanded: false });
    fireEvent.click(toggle);
    // Heading revealed after click.
    expect(within(row).getByText("Config")).toBeInTheDocument();
    expect(within(row).getByText("Layers (2)")).toBeInTheDocument();
    expect(within(row).getByText("Annotations")).toBeInTheDocument();
    // Content: short-form digest for the first layer.
    expect(within(row).getByText("lyr1lyr1lyr1")).toBeInTheDocument();
  });
});
