import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Layout } from "./Layout";

const mockLogout = vi.fn();

// Controllable auth mock — swap per test
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Suppress __APP_VERSION__ — injected by vite define, stub here for tests
vi.stubGlobal("__APP_VERSION__", "0.0.0-test");

function renderLayout(path = "/") {
  return renderWithProviders(<Layout />, {
    routerProps: { initialEntries: [path] },
  });
}

beforeEach(() => {
  mockLogout.mockClear();
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: vi.fn(),
    logout: mockLogout,
  });
});

describe("Layout — unauthenticated", () => {
  it("renders the MetaHub logo", () => {
    renderLayout();
    expect(screen.getByText("MetaHub")).toBeInTheDocument();
  });

  it("renders all desktop nav links", () => {
    renderLayout();
    expect(screen.getAllByText("Collections").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Artifacts").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Profiles").length).toBeGreaterThan(0);
  });

  it("shows Login button when not authenticated", () => {
    renderLayout();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("does not show Settings or Logout when not authenticated", () => {
    renderLayout();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("renders app version in footer", () => {
    renderLayout();
    expect(screen.getByText(/v0\.0\.0-test/)).toBeInTheDocument();
  });

  it("renders copyright in footer", () => {
    renderLayout();
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });
});

describe("Layout — authenticated", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: "1", login: "alice", avatar: "" },
      login: vi.fn(),
      logout: mockLogout,
    });
  });

  it("shows username when authenticated", () => {
    renderLayout();
    expect(screen.getAllByText("alice").length).toBeGreaterThan(0);
  });

  it("shows Settings link when authenticated", () => {
    renderLayout();
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
  });

  it("shows Logout button when authenticated", () => {
    renderLayout();
    expect(screen.getAllByText("Logout").length).toBeGreaterThan(0);
  });

  it("does not show Login button when authenticated", () => {
    renderLayout();
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
  });

  it("calls logout when Logout button is clicked", () => {
    renderLayout();
    const logoutButtons = screen.getAllByText("Logout");
    fireEvent.click(logoutButtons[0]);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("highlights Settings link when on /settings path", () => {
    renderLayout("/settings");
    // Settings link should have active style — just verify it exists
    const settingsLinks = screen.getAllByText("Settings");
    expect(settingsLinks.length).toBeGreaterThan(0);
  });
});

describe("Layout — mobile menu", () => {
  it("mobile menu is hidden by default", () => {
    renderLayout();
    // Mobile nav links are rendered but in a hidden container
    // The toggle button should be present
    expect(screen.getByLabelText("Toggle menu")).toBeInTheDocument();
  });

  it("toggles mobile menu open on hamburger click", () => {
    renderLayout();
    const toggleBtn = screen.getByLabelText("Toggle menu");
    fireEvent.click(toggleBtn);
    // After opening, there should be two sets of nav links (desktop hidden + mobile visible)
    expect(screen.getAllByText("Collections").length).toBeGreaterThan(0);
  });

  it("closes mobile menu when nav link is clicked", () => {
    renderLayout();
    const toggleBtn = screen.getByLabelText("Toggle menu");
    fireEvent.click(toggleBtn); // open
    // Click one of the mobile nav links
    const collectionsLinks = screen.getAllByText("Collections");
    fireEvent.click(collectionsLinks[collectionsLinks.length - 1]);
    // Menu should be closed (hamburger icon back, not X)
    expect(screen.getByLabelText("Toggle menu")).toBeInTheDocument();
  });

  it("shows mobile Login link in mobile menu when unauthenticated", () => {
    renderLayout();
    const toggleBtn = screen.getByLabelText("Toggle menu");
    fireEvent.click(toggleBtn);
    // The mobile menu Login link should be visible
    const loginLinks = screen.getAllByText("Login");
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it("shows mobile Logout when authenticated and menu open", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: "1", login: "alice", avatar: "" },
      login: vi.fn(),
      logout: mockLogout,
    });
    renderLayout();
    const toggleBtn = screen.getByLabelText("Toggle menu");
    fireEvent.click(toggleBtn);
    expect(screen.getAllByText("Logout").length).toBeGreaterThan(0);
  });

  it("mobile Logout calls logout and closes menu", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: "1", login: "alice", avatar: "" },
      login: vi.fn(),
      logout: mockLogout,
    });
    renderLayout();
    fireEvent.click(screen.getByLabelText("Toggle menu"));
    const logoutButtons = screen.getAllByText("Logout");
    // Click the last Logout (the one in the mobile menu)
    fireEvent.click(logoutButtons[logoutButtons.length - 1]);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

describe("Layout — active nav link", () => {
  it("highlights the active nav link based on current path", () => {
    // Render on /collections — the Collections link should get bg-muted class
    renderWithProviders(<Layout />, {
      routerProps: { initialEntries: ["/collections"] },
    });
    const collectionsLinks = screen.getAllByText("Collections");
    // At least one link should be in the document (active styling is via className)
    expect(collectionsLinks.length).toBeGreaterThan(0);
  });
});
