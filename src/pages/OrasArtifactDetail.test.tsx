import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { OrasArtifactDetail } from "./OrasArtifactDetail";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api");
  return {
    ...actual,
    fetchOrasArtifact: vi.fn(),
  };
});

import { fetchOrasArtifact } from "@/lib/api";
const mockFetchOrasArtifact = vi.mocked(fetchOrasArtifact);

const mockArtifact = {
  id: 42,
  repo: "qnib/featuretest",
  digest: "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
  media_type: "application/vnd.oci.image.manifest.v1+json",
  artifact_type: "application/vnd.cyclonedx",
  annotations: { "org.example.key": "value" },
  subject: undefined,
  blobs: [
    {
      digest: "sha256:bbbbbbbb1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      media_type: "application/vnd.cyclonedx+json",
      platform: { os: "", architecture: "" },
      size: 2048,
      registry: "",
    },
  ],
};

describe("OrasArtifactDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders error when repo or type param is missing", () => {
    renderWithProviders(<OrasArtifactDetail />, {
      routerProps: { initialEntries: ["/oras/artifact"] },
    });

    expect(screen.getByText("Missing required parameters")).toBeInTheDocument();
  });

  it("renders artifact metadata", async () => {
    mockFetchOrasArtifact.mockResolvedValue({
      artifact: mockArtifact,
      bread_crumbs: [],
    });

    renderWithProviders(<OrasArtifactDetail />, {
      routerProps: {
        initialEntries: [
          "/oras/artifact?repo=qnib%2Ffeaturetest&type=application%2Fvnd.cyclonedx",
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("qnib/featuretest")).toBeInTheDocument();
      expect(screen.getByText("application/vnd.cyclonedx")).toBeInTheDocument();
    });
  });

  it("renders annotations table", async () => {
    mockFetchOrasArtifact.mockResolvedValue({
      artifact: mockArtifact,
      bread_crumbs: [],
    });

    renderWithProviders(<OrasArtifactDetail />, {
      routerProps: {
        initialEntries: [
          "/oras/artifact?repo=qnib%2Ffeaturetest&type=application%2Fvnd.cyclonedx",
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Annotations")).toBeInTheDocument();
      expect(screen.getByText("org.example.key")).toBeInTheDocument();
      expect(screen.getByText("value")).toBeInTheDocument();
    });
  });

  it("renders blobs list", async () => {
    mockFetchOrasArtifact.mockResolvedValue({
      artifact: mockArtifact,
      bread_crumbs: [],
    });

    renderWithProviders(<OrasArtifactDetail />, {
      routerProps: {
        initialEntries: [
          "/oras/artifact?repo=qnib%2Ffeaturetest&type=application%2Fvnd.cyclonedx",
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Blobs")).toBeInTheDocument();
      expect(screen.getByText("application/vnd.cyclonedx+json")).toBeInTheDocument();
    });
  });

  it("renders subject when present", async () => {
    const artifactWithSubject = {
      ...mockArtifact,
      subject: {
        digest: "sha256:cccccccc1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        media_type: "application/vnd.oci.image.manifest.v1+json",
        platform: { os: "linux", architecture: "amd64" },
        size: 1024,
        registry: "",
      },
    };

    mockFetchOrasArtifact.mockResolvedValue({
      artifact: artifactWithSubject,
      bread_crumbs: [],
    });

    renderWithProviders(<OrasArtifactDetail />, {
      routerProps: {
        initialEntries: [
          "/oras/artifact?repo=qnib%2Ffeaturetest&type=application%2Fvnd.cyclonedx",
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Subject")).toBeInTheDocument();
    });
  });

  it("shows error on API failure", async () => {
    mockFetchOrasArtifact.mockRejectedValue(new Error("Not found"));

    renderWithProviders(<OrasArtifactDetail />, {
      routerProps: {
        initialEntries: [
          "/oras/artifact?repo=qnib%2Ffeaturetest&type=application%2Fvnd.cyclonedx",
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load artifact")).toBeInTheDocument();
    });
  });
});
