import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, fireEvent, act } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { GodModeLoginForm } from "./GodModeLoginForm";
import { ApiError } from "@/lib/api";

// ─── Mocks ──────────────────────────────────────────────────────

const mockLogin = vi.fn();
const mockNavigate = vi.fn();
const mockGodmodeLogin = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    login: mockLogin,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    godmodeLogin: (...args: unknown[]) => mockGodmodeLogin(...args),
  };
});

// Helper that types into both inputs and submits the form, wrapped in act so
// React state transitions are flushed before assertions run.
function fillAndSubmit(username: string, password: string) {
  const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
  const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
  fireEvent.change(usernameInput, { target: { value: username } });
  fireEvent.change(passwordInput, { target: { value: password } });
  const button = screen.getByRole("button", { name: /sign in/i });
  fireEvent.click(button);
}

beforeEach(() => {
  mockLogin.mockReset();
  mockNavigate.mockReset();
  mockGodmodeLogin.mockReset();
  sessionStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ──────────────────────────────────────────────────────

describe("GodModeLoginForm", () => {
  it("renders username, password and submit controls", () => {
    renderWithProviders(<GodModeLoginForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("password input has type=password and current-password autocomplete", () => {
    renderWithProviders(<GodModeLoginForm />);
    const pw = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(pw.type).toBe("password");
    expect(pw.autocomplete).toBe("current-password");
  });

  it("validates non-empty fields without making a request", async () => {
    renderWithProviders(<GodModeLoginForm />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    expect(mockGodmodeLogin).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/username and password are required/i)
    ).toBeInTheDocument();
  });

  it("calls godmodeLogin, AuthContext.login, and navigates on success", async () => {
    mockGodmodeLogin.mockResolvedValueOnce({ token: "fresh-token" });

    renderWithProviders(<GodModeLoginForm />);

    await act(async () => {
      fillAndSubmit("oci", "oci-pass");
    });

    await waitFor(() => {
      expect(mockGodmodeLogin).toHaveBeenCalledWith("oci", "oci-pass");
    });
    expect(mockLogin).toHaveBeenCalledWith("fresh-token");
    expect(mockNavigate).toHaveBeenCalledWith("/collections", {
      replace: true,
    });
  });

  it("trims whitespace from the username before submitting", async () => {
    mockGodmodeLogin.mockResolvedValueOnce({ token: "fresh-token" });

    renderWithProviders(<GodModeLoginForm />);

    await act(async () => {
      fillAndSubmit("  oci  ", "oci-pass");
    });

    await waitFor(() => {
      expect(mockGodmodeLogin).toHaveBeenCalledWith("oci", "oci-pass");
    });
  });

  it("uses metahub_return_url from sessionStorage when present", async () => {
    sessionStorage.setItem("metahub_return_url", "/settings");
    mockGodmodeLogin.mockResolvedValueOnce({ token: "fresh-token" });

    renderWithProviders(<GodModeLoginForm />);

    await act(async () => {
      fillAndSubmit("oci", "oci-pass");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/settings", {
        replace: true,
      });
    });
    expect(sessionStorage.getItem("metahub_return_url")).toBeNull();
  });

  it("shows 'Invalid username or password' on HTTP 401", async () => {
    mockGodmodeLogin.mockRejectedValueOnce(new ApiError("nope", 401));

    renderWithProviders(<GodModeLoginForm />);

    await act(async () => {
      fillAndSubmit("oci", "wrong");
    });

    expect(
      await screen.findByText(/invalid username or password/i)
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows 'God-mode login is disabled' on HTTP 404", async () => {
    mockGodmodeLogin.mockRejectedValueOnce(new ApiError("disabled", 404));

    renderWithProviders(<GodModeLoginForm />);

    await act(async () => {
      fillAndSubmit("oci", "oci-pass");
    });

    expect(
      await screen.findByText(/god-mode login is disabled/i)
    ).toBeInTheDocument();
  });

  it("shows generic message on other ApiError statuses", async () => {
    mockGodmodeLogin.mockRejectedValueOnce(new ApiError("oops", 500));

    renderWithProviders(<GodModeLoginForm />);

    await act(async () => {
      fillAndSubmit("oci", "oci-pass");
    });

    expect(
      await screen.findByText(/login failed, please try again/i)
    ).toBeInTheDocument();
  });

  it("shows generic message on a network/non-ApiError rejection", async () => {
    mockGodmodeLogin.mockRejectedValueOnce(new Error("offline"));

    renderWithProviders(<GodModeLoginForm />);

    await act(async () => {
      fillAndSubmit("oci", "oci-pass");
    });

    expect(
      await screen.findByText(/login failed, please try again/i)
    ).toBeInTheDocument();
  });

  it("disables the submit button while a submission is in flight", async () => {
    let resolveLogin: (v: { token: string }) => void = () => {};
    mockGodmodeLogin.mockImplementationOnce(
      () =>
        new Promise<{ token: string }>((res) => {
          resolveLogin = res;
        })
    );

    renderWithProviders(<GodModeLoginForm />);

    await act(async () => {
      fillAndSubmit("oci", "oci-pass");
    });

    // Button should now be in the "Signing in..." disabled state.
    const button = await screen.findByRole("button", { name: /signing in/i });
    expect(button).toBeDisabled();

    // Resolve the in-flight call so the test can clean up cleanly.
    await act(async () => {
      resolveLogin({ token: "t" });
    });
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("t");
    });
  });
});
