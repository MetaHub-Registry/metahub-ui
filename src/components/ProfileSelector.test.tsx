import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ProfileSelector } from "./ProfileSelector";
import { profiles } from "@/data/profiles";

describe("ProfileSelector", () => {
  it("renders a select element with 'All Profiles' option", () => {
    renderWithProviders(<ProfileSelector />);
    const select = screen.getByLabelText("Profile:");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("All Profiles")).toBeInTheDocument();
  });

  it("renders all profile options", () => {
    renderWithProviders(<ProfileSelector />);
    for (const profile of profiles) {
      expect(screen.getByText(profile.name)).toBeInTheDocument();
    }
  });

  it("defaults to 'All Profiles' when no query parameter", () => {
    renderWithProviders(<ProfileSelector />);
    const select = screen.getByLabelText("Profile:") as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("reflects the profile from URL search params", () => {
    renderWithProviders(<ProfileSelector />, {
      routerProps: { initialEntries: ["/collections?profile=zen3"] },
    });
    const select = screen.getByLabelText("Profile:") as HTMLSelectElement;
    expect(select.value).toBe("zen3");
  });

  it("updates URL when a profile is selected", () => {
    renderWithProviders(<ProfileSelector />, {
      routerProps: { initialEntries: ["/collections"] },
    });
    const select = screen.getByLabelText("Profile:") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "strix-halo" } });
    expect(select.value).toBe("strix-halo");
  });

  it("removes profile param when 'All Profiles' is selected", () => {
    renderWithProviders(<ProfileSelector />, {
      routerProps: { initialEntries: ["/collections?profile=zen3"] },
    });
    const select = screen.getByLabelText("Profile:") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "" } });
    expect(select.value).toBe("");
  });
});
