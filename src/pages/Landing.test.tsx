import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Landing } from "./Landing";

const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Landing", () => {
  it("renders the MetaHub title when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, login: vi.fn(), logout: vi.fn() });
    renderWithProviders(<Landing />);
    expect(screen.getByRole("heading", { name: "MetaHub" })).toBeInTheDocument();
  });

  it("renders the tagline when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, login: vi.fn(), logout: vi.fn() });
    renderWithProviders(<Landing />);
    expect(screen.getByText(/Container image registry/i)).toBeInTheDocument();
  });

  it("renders Login with Authentik button when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, login: vi.fn(), logout: vi.fn() });
    renderWithProviders(<Landing />);
    expect(screen.getByText("Login with Authentik")).toBeInTheDocument();
  });

  it("redirects to /collections when already authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { login: "alice" }, login: vi.fn(), logout: vi.fn() });
    renderWithProviders(<Landing />, {
      routerProps: { initialEntries: ["/"] },
    });
    // Landing redirects → collections content not rendered, "MetaHub" heading absent
    expect(screen.queryByRole("heading", { name: "MetaHub" })).not.toBeInTheDocument();
  });
});
