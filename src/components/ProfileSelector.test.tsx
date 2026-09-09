import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ProfileSelector } from "./ProfileSelector";

// Mock the fetchProfiles API call — inline data to avoid hoisting issues
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    fetchProfiles: vi.fn().mockResolvedValue({
      profiles: [
        { id: 1, name: "", tag: "generic", label: "generic", rules: [] },
        { id: 2, name: "cpu", tag: "zen3", label: "cpu#zen3", rules: [] },
        { id: 3, name: "cpu", tag: "skylake", label: "cpu#skylake", rules: [] },
      ],
    }),
  };
});

describe("ProfileSelector", () => {
  it("renders a select element with 'All Profiles' option", () => {
    renderWithProviders(<ProfileSelector />);
    const select = screen.getByLabelText("Profile:");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("All Profiles")).toBeInTheDocument();
  });

  it("defaults to 'All Profiles' when no query parameter", () => {
    renderWithProviders(<ProfileSelector />);
    const select = screen.getByLabelText("Profile:") as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("updates URL when a profile is selected", async () => {
    renderWithProviders(<ProfileSelector />, {
      routerProps: { initialEntries: ["/collections"] },
    });
    // Wait for profiles to load from mock API
    await waitFor(() => {
      expect(screen.getByText("cpu#zen3")).toBeInTheDocument();
    });
    const select = screen.getByLabelText("Profile:") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "cpu#zen3" } });
    expect(select.value).toBe("cpu#zen3");
  });

  it("removes profile param when 'All Profiles' is selected", () => {
    renderWithProviders(<ProfileSelector />, {
      routerProps: { initialEntries: ["/collections?profile=cpu%23zen3"] },
    });
    const select = screen.getByLabelText("Profile:") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "" } });
    expect(select.value).toBe("");
  });

  // ─── Label-not-name display (task 5.3) ──────────────────────────
  // Dropdown options must show the profile's *label* (e.g. "cpu#zen3"),
  // never its bare name ("cpu") — two cpu profiles would be
  // indistinguishable and the value wouldn't resolve server-side.
  it("lists option text by label, not name", async () => {
    renderWithProviders(<ProfileSelector />, {
      routerProps: { initialEntries: ["/collections"] },
    });
    await waitFor(() => {
      expect(screen.getByText("cpu#zen3")).toBeInTheDocument();
      expect(screen.getByText("cpu#skylake")).toBeInTheDocument();
    });
    // The bare names must not appear as options — only labels.
    const select = screen.getByLabelText("Profile:") as HTMLSelectElement;
    const optionTexts = Array.from(select.options).map((o) => o.textContent);
    expect(optionTexts).toContain("generic");
    expect(optionTexts).toContain("cpu#zen3");
    expect(optionTexts).toContain("cpu#skylake");
    expect(optionTexts).not.toContain("cpu");
  });

  it("uses the label as the option value", async () => {
    renderWithProviders(<ProfileSelector />, {
      routerProps: { initialEntries: ["/collections"] },
    });
    await waitFor(() => {
      expect(screen.getByText("cpu#skylake")).toBeInTheDocument();
    });
    const select = screen.getByLabelText("Profile:") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toContain("cpu#skylake");
    expect(values).not.toContain("skylake");
  });
});
