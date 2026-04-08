import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, act, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Login } from "./Login";
import { ApiError } from "@/lib/api";

const mockFetchAuthConfig = vi.fn();

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getApiBaseUrl: vi.fn(() => ""),
    fetchAuthConfig: (...args: unknown[]) => mockFetchAuthConfig(...args),
  };
});

// The dual-mode and god-mode-only branches mount <GodModeLoginForm/>, which
// internally uses AuthContext + react-router. We stub the form to a tiny
// marker component so the Login tests stay focused on routing/branching.
vi.mock("@/components/GodModeLoginForm", () => ({
  GodModeLoginForm: () => <div data-testid="godmode-login-form" />,
}));

describe("Login", () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, href: "" },
      writable: true,
    });
    mockFetchAuthConfig.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, href: originalHref },
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it("shows a loading state while discovery is in flight", async () => {
    // Resolve never — we just want to assert the loading branch.
    mockFetchAuthConfig.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      renderWithProviders(<Login />);
    });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("OIDC-only: redirects to /api/v1/login after discovery", async () => {
    mockFetchAuthConfig.mockResolvedValueOnce({
      oidc_enabled: true,
      godmode_enabled: false,
    });

    await act(async () => {
      renderWithProviders(<Login />);
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/api/v1/login");
    });
    expect(screen.queryByTestId("godmode-login-form")).not.toBeInTheDocument();
  });

  it("god-mode only: renders the god-mode form and does not redirect", async () => {
    mockFetchAuthConfig.mockResolvedValueOnce({
      oidc_enabled: false,
      godmode_enabled: true,
    });

    await act(async () => {
      renderWithProviders(<Login />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("godmode-login-form")).toBeInTheDocument();
    });
    expect(window.location.href).toBe("");
    expect(
      screen.queryByRole("button", { name: /login with authentik/i })
    ).not.toBeInTheDocument();
  });

  it("dual mode: renders both Authentik button and god-mode form", async () => {
    mockFetchAuthConfig.mockResolvedValueOnce({
      oidc_enabled: true,
      godmode_enabled: true,
    });

    await act(async () => {
      renderWithProviders(<Login />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("godmode-login-form")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /login with authentik/i })
    ).toBeInTheDocument();
    // Should NOT auto-redirect in dual mode.
    expect(window.location.href).toBe("");
  });

  it("dual mode: clicking the Authentik button redirects to /api/v1/login", async () => {
    mockFetchAuthConfig.mockResolvedValueOnce({
      oidc_enabled: true,
      godmode_enabled: true,
    });

    await act(async () => {
      renderWithProviders(<Login />);
    });

    const button = await screen.findByRole("button", {
      name: /login with authentik/i,
    });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(window.location.href).toBe("/api/v1/login");
  });

  it("falls back to the OIDC redirect when discovery throws", async () => {
    mockFetchAuthConfig.mockRejectedValueOnce(new ApiError("boom", 500));

    await act(async () => {
      renderWithProviders(<Login />);
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/api/v1/login");
    });
    expect(screen.queryByTestId("godmode-login-form")).not.toBeInTheDocument();
  });

  it("falls back to the OIDC redirect when discovery throws a non-ApiError", async () => {
    mockFetchAuthConfig.mockRejectedValueOnce(new Error("network down"));

    await act(async () => {
      renderWithProviders(<Login />);
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/api/v1/login");
    });
  });

  it("uses the configured API base URL when redirecting", async () => {
    const { getApiBaseUrl } = await import("@/lib/api");
    vi.mocked(getApiBaseUrl).mockReturnValue("https://api.example.com");
    mockFetchAuthConfig.mockResolvedValueOnce({
      oidc_enabled: true,
      godmode_enabled: false,
    });

    await act(async () => {
      renderWithProviders(<Login />);
    });

    await waitFor(() => {
      expect(window.location.href).toBe("https://api.example.com/api/v1/login");
    });
  });

  it("renders an error message when neither auth method is enabled", async () => {
    mockFetchAuthConfig.mockResolvedValueOnce({
      oidc_enabled: false,
      godmode_enabled: false,
    });

    await act(async () => {
      renderWithProviders(<Login />);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/no authentication method is configured/i)
      ).toBeInTheDocument();
    });
  });
});
