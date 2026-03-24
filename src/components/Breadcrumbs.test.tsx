import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Breadcrumbs } from "./Breadcrumbs";
import type { BreadCrumb } from "@/lib/api";

describe("Breadcrumbs", () => {
  const crumbs: BreadCrumb[] = [
    { crumb: "qnib", active: false, link: "qnib", tag: "", repo: "qnib", idx: 0 },
    { crumb: "featuretest", active: false, link: "qnib/featuretest", tag: "", repo: "qnib/featuretest", idx: 1 },
    { crumb: "latest", active: true, link: "qnib/featuretest/latest", tag: "latest", repo: "qnib/featuretest", idx: 2 },
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
});
