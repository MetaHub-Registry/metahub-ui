import { describe, it, expect } from "vitest";
import {
  profiles,
  getProfileByName,
  manifestMatchesProfile,
} from "./profiles";

describe("profiles data", () => {
  it("has at least one profile", () => {
    expect(profiles.length).toBeGreaterThan(0);
  });

  it("each profile has a name, description, and rules", () => {
    for (const profile of profiles) {
      expect(profile.name).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.rules.length).toBeGreaterThan(0);
    }
  });

  it("includes the generic profile", () => {
    const generic = profiles.find((p) => p.name === "generic");
    expect(generic).toBeDefined();
    expect(generic!.rules[0].type).toBe("plat");
    expect(generic!.rules[0].key).toBe("os");
    expect(generic!.rules[0].value).toBe("linux");
  });
});

describe("getProfileByName", () => {
  it("returns the correct profile", () => {
    const zen3 = getProfileByName("zen3");
    expect(zen3).toBeDefined();
    expect(zen3!.name).toBe("zen3");
  });

  it("returns undefined for unknown profile", () => {
    expect(getProfileByName("nonexistent")).toBeUndefined();
  });
});

describe("manifestMatchesProfile", () => {
  const genericProfile = getProfileByName("generic")!;
  const zen3Profile = getProfileByName("zen3")!;

  it("generic profile matches linux manifests", () => {
    const manifest = {
      platform: { os: "linux", architecture: "amd64" },
    };
    expect(manifestMatchesProfile(manifest, genericProfile)).toBe(true);
  });

  it("generic profile does not match windows manifests", () => {
    const manifest = {
      platform: { os: "windows", architecture: "amd64" },
    };
    expect(manifestMatchesProfile(manifest, genericProfile)).toBe(false);
  });

  it("zen3 profile matches manifests with cpu:zen3 feature", () => {
    const manifest = {
      platform: {
        os: "linux",
        architecture: "amd64",
        features: ["cpu:zen3"],
      },
    };
    expect(manifestMatchesProfile(manifest, zen3Profile)).toBe(true);
  });

  it("zen3 profile does not match manifests without cpu:zen3 feature", () => {
    const manifest = {
      platform: {
        os: "linux",
        architecture: "amd64",
        features: ["cpu:skylake"],
      },
    };
    expect(manifestMatchesProfile(manifest, zen3Profile)).toBe(false);
  });

  it("zen3 profile does not match manifests with no features", () => {
    const manifest = {
      platform: { os: "linux", architecture: "amd64" },
    };
    expect(manifestMatchesProfile(manifest, zen3Profile)).toBe(false);
  });
});
