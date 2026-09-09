import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfileDetail } from "./ProfileDetail";

// Mock the API with a manipulation payload.
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    fetchProfileDetail: vi.fn(),
  };
});

import { fetchProfileDetail } from "@/lib/api";
const mockFetch = vi.mocked(fetchProfileDetail);

function renderDetail(initialPath = "/profiles/cpu%23zen3") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <TooltipProvider>
          <Routes>
            <Route path="/profiles/:label" element={<ProfileDetail />} />
          </Routes>
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const baseResp = {
  id: 2,
  name: "cpu",
  tag: "zen3",
  label: "cpu#zen3",
  rules: [
    {
      id: 2,
      type: "anno",
      op: "eq",
      key: "org.supercontainers.hardware.cpu.target.microarch",
      value: "zen3",
    },
  ],
  collection_count: 3,
  manifest_count: 7,
  manipulations: [] as unknown[],
};

describe("ProfileDetail — manipulations section", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the Manipulations heading", async () => {
    mockFetch.mockResolvedValue({ ...baseResp, manipulations: [] } as never);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText("Manipulations")).toBeInTheDocument()
    );
    expect(
      screen.getByText("No manipulations linked to this profile.")
    ).toBeInTheDocument();
  });

  it("renders a manipulation card with default + variants expandable", async () => {
    mockFetch.mockResolvedValue({
      ...baseResp,
      manipulations: [
        {
          id: 42,
          label: "layer/demo#1.0",
          default: {
            workdir: "/opt/demo",
            user: "1000:1000",
            env: { FOO: "bar" },
            entrypoint: { op: "replace", value: ["/bin/entry"] },
          },
          variants: [
            {
              rule: "arch:arm64=true",
              config: { env: { ARCH: "arm64" } },
            },
          ],
        },
      ],
    } as never);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText("layer/demo#1.0")).toBeInTheDocument()
    );
    // Default label + variants label appear in the subtitle.
    expect(screen.getByText(/default/)).toBeInTheDocument();
    expect(screen.getByText(/1 variant/)).toBeInTheDocument();
    // Collapsed: default content not visible.
    expect(screen.queryByText("Default")).not.toBeInTheDocument();
    // Expand.
    fireEvent.click(screen.getByRole("button", { name: /layer\/demo#1\.0/ }));
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Variants")).toBeInTheDocument();
    expect(screen.getByText("arch:arm64=true")).toBeInTheDocument();
    // Env table cell for FOO.
    expect(screen.getByText("FOO")).toBeInTheDocument();
    // Entrypoint op pill.
    expect(screen.getByText("replace")).toBeInTheDocument();
  });

  it("renders a legacy manipulation with flat layers", async () => {
    mockFetch.mockResolvedValue({
      ...baseResp,
      manipulations: [
        {
          id: 7,
          label: "layer/legacy#1.0",
          layers: [
            { image: "quay.io/x:arm64", rule: "arch:arm64=true" },
            { image: "quay.io/x:amd64", rule: "arch:amd64=true" },
          ],
        },
      ],
    } as never);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText("layer/legacy#1.0")).toBeInTheDocument()
    );
    // Subtitle mentions legacy layers.
    expect(screen.getByText(/legacy layers/)).toBeInTheDocument();
    // Expand.
    fireEvent.click(screen.getByRole("button", { name: /layer\/legacy#1\.0/ }));
    expect(screen.getByText("Layers (legacy form)")).toBeInTheDocument();
    expect(screen.getByText("quay.io/x:arm64")).toBeInTheDocument();
  });

  it("renders a select-chip on layers that carry a slice expression", async () => {
    mockFetch.mockResolvedValue({
      ...baseResp,
      manipulations: [
        {
          id: 11,
          label: "layer/trim#1.0",
          layers: [
            { image: "quay.io/x:arm64", rule: "arch:arm64=true", select: "[1:]" },
            { image: "quay.io/x:amd64", rule: "arch:amd64=true" },
          ],
        },
      ],
    } as never);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText("layer/trim#1.0")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /layer\/trim#1\.0/ }));
    // Chip is only rendered when `select` is set; one of two layers
    // carries it, so exactly one chip must be present.
    const chips = screen.getAllByTestId("manipu-layer-select");
    expect(chips).toHaveLength(1);
    expect(chips[0].textContent).toContain("select: [1:]");
  });
});

describe("ProfileDetail — header, stats, rules, browse link (task 4.5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the profile label heading and name/tag subtitle", async () => {
    mockFetch.mockResolvedValue({ ...baseResp, manipulations: [] } as never);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText("Profile: cpu#zen3")).toBeInTheDocument()
    );
    expect(screen.getByText("cpu / zen3")).toBeInTheDocument();
  });

  it("renders collection and manifest counts from the detail payload", async () => {
    mockFetch.mockResolvedValue({ ...baseResp, manipulations: [] } as never);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText("Profile: cpu#zen3")).toBeInTheDocument()
    );
    expect(screen.getByText("Collections")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Manifests")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders matching rules as badges", async () => {
    mockFetch.mockResolvedValue({ ...baseResp, manipulations: [] } as never);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText("Matching Rules")).toBeInTheDocument()
    );
    expect(
      screen.getByText(/anno:org\.supercontainers\.hardware\.cpu\.target\.microarch eq zen3/)
    ).toBeInTheDocument();
  });

  it("states when a profile defines no rules", async () => {
    mockFetch.mockResolvedValue({
      ...baseResp,
      rules: [],
      manipulations: [],
    } as never);
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText("No rules defined for this profile.")).toBeInTheDocument()
    );
  });

  it("links to the profile-filtered collections view", async () => {
    mockFetch.mockResolvedValue({ ...baseResp, manipulations: [] } as never);
    renderDetail();
    // The button text ends with an arrow entity (&rarr;), so match loosely.
    await waitFor(() =>
      expect(
        screen.getByText(/Browse collections filtered by this profile/)
      ).toBeInTheDocument()
    );
    const link = screen
      .getByText(/Browse collections filtered by this profile/)
      .closest("button");
    expect(link).not.toBeNull();
  });

  it("shows the error state on API failure", async () => {
    mockFetch.mockRejectedValue(new Error("404: profile not found"));
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText("Failed to load profile")).toBeInTheDocument();
      expect(screen.getByText("404: profile not found")).toBeInTheDocument();
    });
  });
});
