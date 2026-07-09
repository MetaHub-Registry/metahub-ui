import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModelDetail } from "./ModelDetail";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, fetchModel: vi.fn() };
});

import { fetchModel, ApiError } from "@/lib/api";
const mockFetchModel = vi.mocked(fetchModel);

function renderDetail(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <TooltipProvider>
          <Routes>
            <Route path="/models/:ref" element={<ModelDetail />} />
          </Routes>
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ModelDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the card with quantizations, sizes, configs, profiles, and source artifact", async () => {
    mockFetchModel.mockResolvedValue({
      model: {
        name: "qwen3-8b",
        label: "model/qwen3-8b",
        profiles: ["vram#12gb", "vram#128gb"],
        quantizations: [
          {
            repo: "models/qwen3-8b-layer",
            tag: "q8-kxl",
            digest: "sha256:abc123def456aa",
            size: 8_589_934_592,
          },
          {
            repo: "models/qwen3-8b-layer",
            tag: "q4-km",
            digest: "sha256:beef00feed11",
            size: 4_294_967_296,
          },
        ],
        configs: [
          {
            profile: "vram#12gb",
            repo: "models/qwen3-8b-config",
            tag: "q8-kxl",
            config_dir: "/model/qwen3-8b/config",
          },
        ],
        compositions: [
          {
            profile: "vram#12gb",
            quant: "q8-kxl",
            runtime: "llama-server",
            runtime_image: "reg/llama-server:1",
            config_repo: "models/qwen3-8b-config",
            config_tag: "q8-kxl",
            config_digest: "sha256:cfg",
          },
        ],
        total_size: 12_884_901_888,
        source_artifact: { repo: "qnib/gpt", digest: "sha256:src" },
      },
    });

    renderDetail("/models/qwen3-8b");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "qwen3-8b" })
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("quant-table")).toBeInTheDocument();
    expect(screen.getAllByTestId("quant-row")).toHaveLength(2);
    // q8-kxl appears both as a quant badge and in the config row → use getAllBy.
    expect(screen.getAllByText("q8-kxl").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("q4-km")).toBeInTheDocument();
    // Per-quant size + total size rendered (base-1024).
    expect(screen.getByText("8 GB")).toBeInTheDocument();
    expect(screen.getByTestId("model-total-size")).toHaveTextContent(
      "12 GB total"
    );
    // Per-profile config row.
    expect(screen.getByTestId("detail-config-row")).toBeInTheDocument();
    expect(
      screen.getByText(/\/model\/qwen3-8b\/config/)
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("detail-profile-link")).toHaveLength(2);
    expect(screen.getByText("qnib/gpt")).toBeInTheDocument();
    // Composition (referrers-derived): table + runtime name.
    expect(screen.getByTestId("composition-table")).toBeInTheDocument();
    expect(screen.getByTestId("composition-row")).toBeInTheDocument();
    expect(screen.getByText("llama-server")).toBeInTheDocument();
    // Run snippet: resolved runtime image → copy-paste docker run.
    expect(screen.getByTestId("run-snippet")).toBeInTheDocument();
    expect(
      screen.getByText(/docker run --gpus all -p 8080:8080 reg\/llama-server:1/)
    ).toBeInTheDocument();
  });

  it("shows not-found for an unknown model (404)", async () => {
    mockFetchModel.mockRejectedValue(new ApiError("model not found", 404));
    renderDetail("/models/nope");
    await waitFor(() => {
      expect(screen.getByText("Model not found")).toBeInTheDocument();
    });
  });
});
