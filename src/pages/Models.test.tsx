import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Models } from "./Models";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api");
  return {
    ...actual,
    fetchModels: vi.fn(),
  };
});

import { fetchModels } from "@/lib/api";
const mockFetchModels = vi.mocked(fetchModels);

describe("Models", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title and empty state", async () => {
    mockFetchModels.mockResolvedValue({ models: [] });

    renderWithProviders(<Models />, {
      routerProps: { initialEntries: ["/models"] },
    });

    expect(screen.getByText("Models")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("No models found")).toBeInTheDocument();
    });
  });

  it("renders a model card with profiles and image variants", async () => {
    mockFetchModels.mockResolvedValue({
      models: [
        {
          name: "e2e-gguf35",
          label: "model/e2e-gguf35",
          profiles: ["vram#12gb"],
          images: [
            { repo: "models/e2e-gguf35-layer", tag: "q8-kxl", digest: "sha256:abc123", size: 262146560 },
          ],
          total_size: 262146560,
          source_artifact: { repo: "e2e-models/e2e-gguf35", digest: "sha256:src" },
        },
      ],
    });

    renderWithProviders(<Models />, {
      routerProps: { initialEntries: ["/models"] },
    });

    await waitFor(() => {
      expect(screen.getByText("e2e-gguf35")).toBeInTheDocument();
    });
    expect(screen.getByText("vram#12gb")).toBeInTheDocument();
    expect(screen.getByText("q8-kxl")).toBeInTheDocument();
    // Catalog card overview: quantization count + total size.
    expect(screen.getByTestId("model-card-overview")).toHaveTextContent(
      "1 quantization"
    );
    expect(screen.getByTestId("model-card-size")).toHaveTextContent("250 MB");
    // The profile badge links to the profile detail page ('#' URL-encoded).
    expect(screen.getByTestId("model-profile-link")).toHaveAttribute(
      "href",
      "/profiles/vram%2312gb"
    );
    // The source artifact links to the Artifacts tab for its repo.
    expect(screen.getByTestId("model-source-link")).toHaveAttribute(
      "href",
      "/oras/e2e-models/e2e-gguf35"
    );
  });

  it("filters models by name", async () => {
    mockFetchModels.mockResolvedValue({
      models: [
        { name: "qwen3-8b", label: "model/qwen3-8b", profiles: [], images: [] },
        { name: "llama3", label: "model/llama3", profiles: [], images: [] },
      ],
    });

    renderWithProviders(<Models />, {
      routerProps: { initialEntries: ["/models"] },
    });

    await waitFor(() => {
      expect(screen.getByText("qwen3-8b")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText("Filter models..."), {
      target: { value: "llama" },
    });
    expect(screen.queryByText("qwen3-8b")).not.toBeInTheDocument();
    expect(screen.getByText("llama3")).toBeInTheDocument();
  });
});
