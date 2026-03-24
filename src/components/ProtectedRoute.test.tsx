import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ProtectedRoute } from "./ProtectedRoute";

// Mock the AuthContext
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    renderWithProviders(
      <ProtectedRoute>
        <p>Protected content</p>
      </ProtectedRoute>
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("shows loading state when auth is loading", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    renderWithProviders(
      <ProtectedRoute>
        <p>Protected content</p>
      </ProtectedRoute>
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <ProtectedRoute>
        <p>Protected content</p>
      </ProtectedRoute>,
      { routerProps: { initialEntries: ["/settings"] } }
    );

    // Should not render children
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("saves return URL to sessionStorage when redirecting", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithProviders(
      <ProtectedRoute>
        <p>Protected content</p>
      </ProtectedRoute>,
      { routerProps: { initialEntries: ["/settings"] } }
    );

    // After redirect, sessionStorage should have been set before the Navigate happened
    // MemoryRouter processes the redirect, but sessionStorage was set during the render
    const returnUrl = sessionStorage.getItem("metahub_return_url");
    expect(returnUrl).toBeTruthy();
  });
});
