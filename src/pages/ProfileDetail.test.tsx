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
});
