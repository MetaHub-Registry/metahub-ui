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

  it("plat rule matches on architecture key", () => {
    const archProfile = {
      name: "amd64-only",
      description: "AMD64 only",
      rules: [{ type: "plat", key: "architecture", op: "eq", value: "amd64" }],
    };
    const matching = { platform: { os: "linux", architecture: "amd64" } };
    const nonMatching = { platform: { os: "linux", architecture: "arm64" } };
    expect(manifestMatchesProfile(matching, archProfile)).toBe(true);
    expect(manifestMatchesProfile(nonMatching, archProfile)).toBe(false);
  });

  it("plat rule with unknown key returns false", () => {
    const unknownKeyProfile = {
      name: "unknown-key",
      description: "Unknown key profile",
      rules: [{ type: "plat", key: "variant", op: "eq", value: "v8" }],
    };
    const manifest = { platform: { os: "linux", architecture: "arm64" } };
    expect(manifestMatchesProfile(manifest, unknownKeyProfile)).toBe(false);
  });

  it("rule with unknown type returns false", () => {
    const unknownTypeProfile = {
      name: "unknown-type",
      description: "Unknown type profile",
      rules: [{ type: "gpu", key: "model", op: "eq", value: "a100" }],
    };
    const manifest = { platform: { os: "linux", architecture: "amd64" } };
    expect(manifestMatchesProfile(manifest, unknownTypeProfile)).toBe(false);
  });

  it("profile with no rules matches everything", () => {
    const emptyProfile = { name: "empty", description: "No rules", rules: [] };
    const manifest = { platform: { os: "linux", architecture: "amd64" } };
    expect(manifestMatchesProfile(manifest, emptyProfile)).toBe(true);
  });

  it("cpu rule with no features array returns false", () => {
    const cpuProfile = {
      name: "zen3-cpu",
      description: "Zen3",
      rules: [{ type: "cpu", key: "zen3", op: "eq", value: "true" }],
    };
    // No features array at all
    const manifest = { platform: { os: "linux", architecture: "amd64" } };
    expect(manifestMatchesProfile(manifest, cpuProfile)).toBe(false);
  });
});
