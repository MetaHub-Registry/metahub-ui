// Static profile configuration.
// This will be replaced by a GET /api/v1/profiles endpoint in a future change.

export interface Profile {
  name: string;
  description: string;
  rules: ProfileRule[];
}

export interface ProfileRule {
  type: string; // "plat", "cpu", "arch", etc.
  key: string;
  op: string; // "eq"
  value: string;
}

export const profiles: Profile[] = [
  {
    name: "generic",
    description: "Standard platform images (linux/amd64, linux/arm64)",
    rules: [{ type: "plat", key: "os", op: "eq", value: "linux" }],
  },
  {
    name: "skylake",
    description: "Intel Skylake CPU microarchitecture",
    rules: [{ type: "cpu", key: "skylake", op: "eq", value: "true" }],
  },
  {
    name: "icelake",
    description: "Intel Ice Lake CPU microarchitecture",
    rules: [{ type: "cpu", key: "icelake", op: "eq", value: "true" }],
  },
  {
    name: "broadwell",
    description: "Intel Broadwell CPU microarchitecture",
    rules: [{ type: "cpu", key: "broadwell", op: "eq", value: "true" }],
  },
  {
    name: "cascadelake",
    description: "Intel Cascade Lake CPU microarchitecture",
    rules: [{ type: "cpu", key: "cascadelake", op: "eq", value: "true" }],
  },
  {
    name: "zen",
    description: "AMD Zen CPU microarchitecture",
    rules: [{ type: "cpu", key: "zen", op: "eq", value: "true" }],
  },
  {
    name: "zen2",
    description: "AMD Zen 2 CPU microarchitecture",
    rules: [{ type: "cpu", key: "zen2", op: "eq", value: "true" }],
  },
  {
    name: "zen3",
    description: "AMD Zen 3 CPU microarchitecture",
    rules: [{ type: "cpu", key: "zen3", op: "eq", value: "true" }],
  },
  {
    name: "strix-halo",
    description: "AMD Strix Halo iGPU (Radeon 890M/880M)",
    rules: [{ type: "cpu", key: "strix-halo", op: "eq", value: "true" }],
  },
  {
    name: "graviton2",
    description: "AWS Graviton2 ARM processor",
    rules: [{ type: "cpu", key: "graviton2", op: "eq", value: "true" }],
  },
  {
    name: "graviton3",
    description: "AWS Graviton3 ARM processor",
    rules: [{ type: "cpu", key: "graviton3", op: "eq", value: "true" }],
  },
];

/**
 * Check if a manifest's platform features match a profile's rules.
 */
export function manifestMatchesProfile(
  manifest: {
    platform: {
      os: string;
      architecture: string;
      variant?: string;
      features?: string[];
    };
  },
  profile: Profile
): boolean {
  return profile.rules.every((rule) => {
    if (rule.type === "plat") {
      if (rule.key === "os") return manifest.platform.os === rule.value;
      if (rule.key === "architecture")
        return manifest.platform.architecture === rule.value;
      return false;
    }
    if (rule.type === "cpu") {
      // CPU features are in platform.features or annotations
      const features = manifest.platform.features || [];
      return features.some(
        (f) => f.toLowerCase() === `cpu:${rule.key}`.toLowerCase()
      );
    }
    return false;
  });
}

export function getProfileByName(name: string): Profile | undefined {
  return profiles.find((p) => p.name === name);
}
