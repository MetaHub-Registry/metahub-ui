import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Profiles } from "./Profiles";
import { profiles } from "@/data/profiles";

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
            <Route path="/profiles/:name" element={<Profiles />} />
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

  it("renders all profiles from the static config", () => {
    renderProfilesWithRoute("/profiles");

    for (const profile of profiles) {
      expect(screen.getByText(profile.name)).toBeInTheDocument();
    }
  });

  it("displays profile descriptions", () => {
    renderProfilesWithRoute("/profiles");

    for (const profile of profiles) {
      expect(screen.getByText(profile.description)).toBeInTheDocument();
    }
  });

  it("renders profile detail view when name param is present", () => {
    renderProfilesWithRoute("/profiles/zen3");

    expect(screen.getByText("Profile: zen3")).toBeInTheDocument();
    expect(
      screen.getByText("AMD Zen 3 CPU microarchitecture")
    ).toBeInTheDocument();
  });

  it("shows matching rules in detail view", () => {
    renderProfilesWithRoute("/profiles/zen3");

    expect(screen.getByText("Matching Rules")).toBeInTheDocument();
    expect(screen.getByText("cpu:zen3 eq true")).toBeInTheDocument();
  });

  it("shows link to browse collections with profile filter", () => {
    renderProfilesWithRoute("/profiles/zen3");

    const link = screen.getByText(
      /Browse collections filtered by this profile/
    );
    expect(link).toBeInTheDocument();
  });
});
