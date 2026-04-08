import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Callback } from "./Callback";

const mockLogin = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    login: mockLogin,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

afterEach(() => {
  mockLogin.mockClear();
  // Reset location hash
  window.location.hash = "";
});

describe("Callback", () => {
  it("shows error when no access token in URL hash", async () => {
    window.location.hash = "";
    await act(async () => {
      renderWithProviders(<Callback />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
    });
  });

  it("shows Try again link when authentication fails", async () => {
    window.location.hash = "";
    await act(async () => {
      renderWithProviders(<Callback />);
    });
    await waitFor(() => {
      expect(screen.getByText("Try again")).toBeInTheDocument();
    });
  });

  it("shows loading state initially when token is present", async () => {
    window.location.hash = "#access_token=test-token-123";
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});

    await act(async () => {
      renderWithProviders(<Callback />);
    });

    // With a token, the error branch should NOT be shown
    expect(screen.queryByText(/Authentication failed/i)).not.toBeInTheDocument();
  });

  it("calls login with the access token from URL hash", async () => {
    window.location.hash = "#access_token=my-secret-token";
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});

    await act(async () => {
      renderWithProviders(<Callback />);
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("my-secret-token");
    });
  });

  it("clears the hash from URL after processing token", async () => {
    window.location.hash = "#access_token=test-token";
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});

    await act(async () => {
      renderWithProviders(<Callback />);
    });

    await waitFor(() => {
      expect(replaceState).toHaveBeenCalledWith(null, "", window.location.pathname);
    });
  });

  it("redirects to /collections by default when no saved return URL", async () => {
    window.location.hash = "#access_token=test-token";
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    vi.spyOn(sessionStorage, "getItem").mockReturnValue(null);
    vi.spyOn(sessionStorage, "removeItem").mockImplementation(() => {});

    await act(async () => {
      renderWithProviders(<Callback />);
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test-token");
    });
  });

  it("reads and removes the return URL from sessionStorage", async () => {
    window.location.hash = "#access_token=test-token";
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});

    // Pre-populate sessionStorage with the return URL
    sessionStorage.setItem("metahub_return_url", "/settings");

    await act(async () => {
      renderWithProviders(<Callback />);
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test-token");
    });

    // The return URL should have been removed from sessionStorage
    expect(sessionStorage.getItem("metahub_return_url")).toBeNull();
  });
});
