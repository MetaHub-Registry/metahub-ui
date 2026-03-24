import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { AuthProvider, useAuth } from "./AuthContext";

// Mock the API module
vi.mock("@/lib/api", () => {
  const actual: Record<string, unknown> = {};
  return {
    ...actual,
    getToken: vi.fn(() => null),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    setOnUnauthorized: vi.fn(),
    fetchSession: vi.fn(),
    fetchLogout: vi.fn(),
  };
});

import {
  getToken,
  setToken as storeToken,
  clearToken,
  fetchSession,
  fetchLogout,
} from "@/lib/api";

const mockGetToken = vi.mocked(getToken);
const mockStoreToken = vi.mocked(storeToken);
const mockClearToken = vi.mocked(clearToken);
const mockFetchSession = vi.mocked(fetchSession);
const mockFetchLogout = vi.mocked(fetchLogout);

// Test component that exposes auth context values
function AuthConsumer() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="is-authenticated">{String(isAuthenticated)}</span>
      <span data-testid="is-loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.login : "null"}</span>
      <button data-testid="login-btn" onClick={() => login("new-token")}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockGetToken.mockReturnValue(null);
  });

  it("provides unauthenticated state when no token exists", async () => {
    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      expect(screen.getByTestId("is-loading").textContent).toBe("false");
      expect(screen.getByTestId("user").textContent).toBe("null");
    });
  });

  it("validates token on mount and sets user when valid", async () => {
    mockGetToken.mockReturnValue("valid-token");
    mockFetchSession.mockResolvedValue({
      id: "1",
      login: "testuser",
      avatar: "https://example.com/avatar.png",
    });

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Initially loading
    expect(screen.getByTestId("is-loading").textContent).toBe("true");

    // After session fetch resolves
    await waitFor(() => {
      expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      expect(screen.getByTestId("user").textContent).toBe("testuser");
      expect(screen.getByTestId("is-loading").textContent).toBe("false");
    });
  });

  it("clears token when session validation fails", async () => {
    mockGetToken.mockReturnValue("expired-token");
    mockFetchSession.mockRejectedValue(new Error("401"));

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      expect(screen.getByTestId("user").textContent).toBe("null");
      expect(mockClearToken).toHaveBeenCalled();
    });
  });

  it("stores token on login", async () => {
    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Wait for initial state
    await waitFor(() => {
      expect(screen.getByTestId("is-loading").textContent).toBe("false");
    });

    // Mock the session fetch for the new token
    mockFetchSession.mockResolvedValue({
      id: "1",
      login: "newuser",
      avatar: "",
    });

    // Trigger login
    await act(async () => {
      screen.getByTestId("login-btn").click();
    });

    expect(mockStoreToken).toHaveBeenCalledWith("new-token");
  });

  it("clears state on logout", async () => {
    mockGetToken.mockReturnValue("valid-token");
    mockFetchSession.mockResolvedValue({
      id: "1",
      login: "testuser",
      avatar: "",
    });
    mockFetchLogout.mockResolvedValue(undefined);

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
    });

    // Trigger logout
    await act(async () => {
      screen.getByTestId("logout-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      expect(screen.getByTestId("user").textContent).toBe("null");
      expect(mockClearToken).toHaveBeenCalled();
      expect(mockFetchLogout).toHaveBeenCalled();
    });
  });

  it("handles logout API errors gracefully", async () => {
    mockGetToken.mockReturnValue("valid-token");
    mockFetchSession.mockResolvedValue({
      id: "1",
      login: "testuser",
      avatar: "",
    });
    mockFetchLogout.mockRejectedValue(new Error("Network error"));

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
    });

    // Logout should still clear state even if API fails
    await act(async () => {
      screen.getByTestId("logout-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      expect(mockClearToken).toHaveBeenCalled();
    });
  });

  it("throws error when useAuth is called outside AuthProvider", () => {
    // Suppress console.error for expected error
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderWithProviders(<AuthConsumer />);
    }).toThrow("useAuth must be used within an AuthProvider");
  });
});
