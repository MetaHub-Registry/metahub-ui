import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Breadcrumbs } from "./Breadcrumbs";
import type { BreadCrumb } from "@/lib/api";

describe("Breadcrumbs", () => {
  const crumbs: BreadCrumb[] = [
    { crumb: "qnib", active: 0, link: "qnib", tag: "", repo: "qnib", idx: 0 },
    { crumb: "featuretest", active: 0, link: "qnib/featuretest", tag: "", repo: "qnib/featuretest", idx: 1 },
    { crumb: "latest", active: 1, link: "qnib/featuretest/latest", tag: "latest", repo: "qnib/featuretest", idx: 2 },
  ];

  it("renders a Home link", () => {
    renderWithProviders(<Breadcrumbs crumbs={crumbs} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders all crumb segments", () => {
    renderWithProviders(<Breadcrumbs crumbs={crumbs} />);
    expect(screen.getByText("qnib")).toBeInTheDocument();
    expect(screen.getByText("featuretest")).toBeInTheDocument();
    expect(screen.getByText("latest")).toBeInTheDocument();
  });

  it("renders inactive crumbs as links", () => {
    renderWithProviders(<Breadcrumbs crumbs={crumbs} />);
    const qnibLink = screen.getByText("qnib").closest("a");
    expect(qnibLink).toBeInTheDocument();
    expect(qnibLink).toHaveAttribute("href", "/collections/qnib");
  });

  it("renders the active crumb as plain text (not a link)", () => {
    renderWithProviders(<Breadcrumbs crumbs={crumbs} />);
    const latestElement = screen.getByText("latest");
    expect(latestElement.tagName).not.toBe("A");
    expect(latestElement.closest("a")).toBeNull();
  });

  it("includes profile query parameter in links when provided", () => {
    renderWithProviders(<Breadcrumbs crumbs={crumbs} profile="zen3" />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/collections?profile=zen3");

    const qnibLink = screen.getByText("qnib").closest("a");
    expect(qnibLink).toHaveAttribute("href", "/collections/qnib?profile=zen3");
  });

  it("does not include profile parameter when not provided", () => {
    renderWithProviders(<Breadcrumbs crumbs={crumbs} />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/collections");
  });

  it("renders separator slashes between crumbs", () => {
    renderWithProviders(<Breadcrumbs crumbs={crumbs} />);
    const separators = screen.getAllByText("/");
    expect(separators.length).toBe(3);
  });

  it("has correct aria label for accessibility", () => {
    renderWithProviders(<Breadcrumbs crumbs={crumbs} />);
    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
  });

  it("does not double-prefix /collections/ when link is a bare repo path", () => {
    // Regression test: API now emits bare repo paths in link field.
    // The component prepends /collections/ itself, so the href must be /collections/<link>
    // and never /collections//collections/<link> or similar.
    renderWithProviders(<Breadcrumbs crumbs={crumbs} />);
    const qnibLink = screen.getByText("qnib").closest("a");
    expect(qnibLink).toHaveAttribute("href", "/collections/qnib");
    // Confirm no double-prefix
    expect(qnibLink?.getAttribute("href")).not.toContain("/collections//");
    expect(qnibLink?.getAttribute("href")).not.toMatch(/\/collections\/.*\/collections\//);
  });

  describe("ORAS section breadcrumbs", () => {
    it("Home link points to /oras when section=oras", () => {
      renderWithProviders(<Breadcrumbs crumbs={crumbs} section="oras" />);
      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveAttribute("href", "/oras");
    });

    it("inactive crumb links to /oras/<path> when section=oras", () => {
      renderWithProviders(<Breadcrumbs crumbs={crumbs} section="oras" />);
      const qnibLink = screen.getByText("qnib").closest("a");
      expect(qnibLink).toHaveAttribute("href", "/oras/qnib");
    });

    it("multi-segment crumb links to /oras/<path> when section=oras", () => {
      renderWithProviders(<Breadcrumbs crumbs={crumbs} section="oras" />);
      const ftLink = screen.getByText("featuretest").closest("a");
      expect(ftLink).toHaveAttribute("href", "/oras/qnib/featuretest");
    });

    it("active crumb is still plain text even with section=oras", () => {
      renderWithProviders(<Breadcrumbs crumbs={crumbs} section="oras" />);
      const latestElement = screen.getByText("latest");
      expect(latestElement.tagName).not.toBe("A");
      expect(latestElement.closest("a")).toBeNull();
    });

    it("defaults to /collections when section prop is not provided", () => {
      renderWithProviders(<Breadcrumbs crumbs={crumbs} />);
      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveAttribute("href", "/collections");
    });
  });
});
