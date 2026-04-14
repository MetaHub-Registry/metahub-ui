import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Profiles } from "./Profiles";
import { ProfileDetail } from "./ProfileDetail";

// Mock the API — inline data to avoid hoisting issues
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    fetchProfiles: vi.fn().mockResolvedValue({
      profiles: [
        { id: 1, name: "", tag: "generic", label: "generic", rules: [{ id: 1, type: "plat", op: "eq", key: "os", value: "linux" }] },
        { id: 2, name: "cpu", tag: "zen3", label: "cpu#zen3", rules: [{ id: 2, type: "anno", op: "eq", key: "org.supercontainers.hardware.cpu.target.microarch", value: "zen3" }] },
      ],
    }),
    fetchProfileDetail: vi.fn().mockResolvedValue({
      id: 2,
      name: "cpu",
      tag: "zen3",
      label: "cpu#zen3",
      rules: [{ id: 2, type: "anno", op: "eq", key: "org.supercontainers.hardware.cpu.target.microarch", value: "zen3" }],
      collection_count: 3,
      manifest_count: 7,
    }),
  };
});

function renderProfilesWithRoute(initialPath = "/profiles") {
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
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/profiles/:label" element={<ProfileDetail />} />
          </Routes>
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Profiles", () => {
  it("renders the page title", () => {
    renderProfilesWithRoute("/profiles");
    expect(screen.getByText("Profiles")).toBeInTheDocument();
  });

  it("renders profile detail view when label param is present", async () => {
    renderProfilesWithRoute("/profiles/cpu%23zen3");
    expect(await screen.findByText("Profile: cpu#zen3")).toBeInTheDocument();
  });

  it("shows matching rules in detail view", async () => {
    renderProfilesWithRoute("/profiles/cpu%23zen3");
    expect(await screen.findByText("Matching Rules")).toBeInTheDocument();
  });

  it("shows link to browse collections with profile filter", async () => {
    renderProfilesWithRoute("/profiles/cpu%23zen3");
    const link = await screen.findByText(
      /Browse collections filtered by this profile/
    );
    expect(link).toBeInTheDocument();
  });

  it("shows collection and manifest counts", async () => {
    renderProfilesWithRoute("/profiles/cpu%23zen3");
    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(await screen.findByText("7")).toBeInTheDocument();
  });
});
