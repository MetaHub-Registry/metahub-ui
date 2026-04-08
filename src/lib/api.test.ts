import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getApiBaseUrl,
  getToken,
  setToken,
  clearToken,
  setOnUnauthorized,
  apiFetch,
  ApiError,
  fetchCollections,
  fetchCollection,
  fetchOrasArtifacts,
  fetchOrasArtifact,
  fetchSession,
  fetchLogout,
  fetchRegistryTokens,
  createRegistryToken,
  deleteRegistryToken,
  fetchProfiles,
  fetchAuthConfig,
  godmodeLogin,
} from "./api";

// Mock localStorage since jsdom may not fully support it
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Token management", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns null when no token is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("stores and retrieves a token", () => {
    setToken("test-token-123");
    expect(getToken()).toBe("test-token-123");
  });

  it("clears a stored token", () => {
    setToken("test-token-123");
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe("getApiBaseUrl", () => {
  beforeEach(() => {
    localStorageMock.clear();
    delete (window as unknown as Record<string, unknown>).__METAHUB_API_URL__;
  });

  it("returns empty string by default (same-origin)", () => {
    expect(getApiBaseUrl()).toBe("");
  });

  it("returns localStorage override when set", () => {
    localStorageMock.setItem("metahub_api_base_url", "http://localhost:8080");
    expect(getApiBaseUrl()).toBe("http://localhost:8080");
  });

  it("strips trailing slash from localStorage value", () => {
    localStorageMock.setItem("metahub_api_base_url", "http://localhost:8080/");
    expect(getApiBaseUrl()).toBe("http://localhost:8080");
  });

  it("returns runtime config when set", () => {
    (window as unknown as Record<string, unknown>).__METAHUB_API_URL__ =
      "https://api.metahub.example.com";
    expect(getApiBaseUrl()).toBe("https://api.metahub.example.com");
  });

  it("ignores placeholder value", () => {
    (window as unknown as Record<string, unknown>).__METAHUB_API_URL__ =
      "__METAHUB_API_URL__";
    expect(getApiBaseUrl()).toBe("");
  });
});

describe("apiFetch", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("attaches Bearer token to request", async () => {
    setToken("my-token");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ data: "test" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/v1/test");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer my-token");
  });

  it("throws ApiError on non-ok response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve("Server error"),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/api/v1/test")).rejects.toThrow(ApiError);
  });

  it("clears token on 401 response", async () => {
    setToken("expired-token");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/api/v1/test")).rejects.toThrow(ApiError);
    expect(getToken()).toBeNull();
  });

  it("sets Content-Type for requests with body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/v1/test", {
      method: "POST",
      body: JSON.stringify({ key: "value" }),
    });

    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
  });
});

describe("ORAS API functions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("fetchOrasArtifacts with prefix sends correct URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ next: {}, bread_crumbs: [], slug_end: 0 }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchOrasArtifacts("qnib/featuretest");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/oras");
    expect(url).toContain("repo=qnib%2Ffeaturetest");
  });

  it("fetchOrasArtifacts with empty prefix sends URL without repo param", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ next: {}, bread_crumbs: [], slug_end: 0 }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchOrasArtifacts("");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/oras");
  });

  it("fetchOrasArtifact sends correct URL with repo and artifact_type", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ artifact: {}, bread_crumbs: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchOrasArtifact("qnib/featuretest", "application/vnd.cyclonedx");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/oras/artifact");
    expect(url).toContain("repo=qnib%2Ffeaturetest");
    expect(url).toContain("artifact_type=application%2Fvnd.cyclonedx");
  });
});

describe("apiFetch — additional branches", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("calls onUnauthorized callback on 401 when one is registered", async () => {
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/api/v1/test")).rejects.toThrow(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    // Cleanup: reset the callback
    setOnUnauthorized(() => {});
  });

  it("returns undefined for 204 No Content response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      json: () => Promise.reject(new Error("should not parse")),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch("/api/v1/test");
    expect(result).toBeUndefined();
  });

  it("returns undefined when content-length is 0", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-length": "0" }),
      json: () => Promise.reject(new Error("should not parse")),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch("/api/v1/test");
    expect(result).toBeUndefined();
  });

  it("uses empty string when response.text() throws in error handler", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.reject(new Error("text() failed")),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/api/v1/test")).rejects.toThrow("Internal Server Error");
  });
});

describe("Collections API functions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("fetchCollections sends POST to /api/v1/collections with repo in body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ next: {}, bread_crumbs: [], slug_end: 0 }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchCollections("qnib/featuretest");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/collections");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ repo: "qnib/featuretest" });
  });

  it("fetchCollection by IDs sends collection_id and tag_id", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ collection: {}, bread_crumbs: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchCollection("", "", 42, 7);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/collection");
    expect(JSON.parse(options.body)).toEqual({ collection_id: 42, tag_id: 7 });
  });

  it("fetchCollection by name sends repo_name and tag_name", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ collection: {}, bread_crumbs: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchCollection("qnib/featuretest", "arm64");

    const [, options] = mockFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ repo_name: "qnib/featuretest", tag_name: "arm64" });
  });
});

describe("Auth API functions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("fetchSession sends GET to /api/v1/protected/session", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ id: "1", login: "alice", avatar: "" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const session = await fetchSession();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/protected/session");
    expect(session.login).toBe("alice");
  });

  it("fetchLogout sends GET to /api/v1/protected/logout", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchLogout();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/protected/logout");
  });
});

describe("Registry Token API functions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("fetchRegistryTokens sends GET to /api/v1/protected/registry-tokens", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchRegistryTokens();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/protected/registry-tokens");
  });

  it("createRegistryToken sends POST with description", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ identifier: "tok-1", password: "secret", docker_login: "docker login ..." }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await createRegistryToken("my laptop");
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/protected/registry-token");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ description: "my laptop" });
  });

  it("deleteRegistryToken sends DELETE with URI-encoded identifier", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    });
    vi.stubGlobal("fetch", mockFetch);

    await deleteRegistryToken("tok/with/slashes");
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/protected/registry-tokens/tok%2Fwith%2Fslashes");
    expect(options.method).toBe("DELETE");
  });
});

describe("Profiles API functions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("fetchProfiles sends GET request to /api/v1/profiles", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ profiles: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchProfiles();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/profiles");
  });

  it("fetchProfiles returns profiles array from response", async () => {
    const mockProfiles = [
      { id: 1, name: "generic", tag: "v1", label: "generic#v1", rules: [] },
    ];
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ profiles: mockProfiles }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchProfiles();
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].name).toBe("generic");
  });
});

// ─── fetchAuthConfig tests ──────────────────────────────────────

describe("fetchAuthConfig", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("issues an unauthenticated GET to /api/v1/auth/config", async () => {
    setToken("should-not-be-attached");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () =>
        Promise.resolve({ oidc_enabled: true, godmode_enabled: false }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const cfg = await fetchAuthConfig();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/auth/config");
    expect(options.method).toBe("GET");
    // Must NOT carry the stale Bearer token from sessionStorage.
    const headers = options.headers as Record<string, string> | undefined;
    expect(headers && headers["Authorization"]).toBeUndefined();
    expect(cfg).toEqual({ oidc_enabled: true, godmode_enabled: false });
  });

  it("returns the parsed config object on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () =>
        Promise.resolve({ oidc_enabled: false, godmode_enabled: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const cfg = await fetchAuthConfig();
    expect(cfg.oidc_enabled).toBe(false);
    expect(cfg.godmode_enabled).toBe(true);
  });

  it("throws ApiError on non-2xx response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve("boom"),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchAuthConfig()).rejects.toBeInstanceOf(ApiError);
  });

  it("throws ApiError on malformed payload", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ oidc_enabled: "yes" }), // wrong shape
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchAuthConfig()).rejects.toBeInstanceOf(ApiError);
  });

  it("propagates network errors as rejection", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchAuthConfig()).rejects.toThrow("network down");
  });
});

// ─── godmodeLogin tests ─────────────────────────────────────────

describe("godmodeLogin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("POSTs JSON credentials to /api/v1/godmode/login", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ token: "abc.def.ghi" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await godmodeLogin("oci", "oci-pass");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/godmode/login");
    expect(options.method).toBe("POST");
    expect((options.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json"
    );
    expect(JSON.parse(options.body)).toEqual({
      username: "oci",
      password: "oci-pass",
    });
    expect(result).toEqual({ token: "abc.def.ghi" });
  });

  it("does not attach a stale Bearer token", async () => {
    setToken("stale");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ token: "fresh" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await godmodeLogin("oci", "oci-pass");
    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("throws ApiError with status 401 on invalid credentials", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: () => Promise.resolve(`{"error":"invalid credentials"}`),
    });
    vi.stubGlobal("fetch", mockFetch);

    try {
      await godmodeLogin("oci", "wrong");
      expect.fail("expected godmodeLogin to reject");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(401);
    }
  });

  it("throws ApiError with status 404 when god-mode is disabled", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: () => Promise.resolve(`{"error":"god-mode login is not enabled"}`),
    });
    vi.stubGlobal("fetch", mockFetch);

    try {
      await godmodeLogin("oci", "oci-pass");
      expect.fail("expected godmodeLogin to reject");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(404);
    }
  });

  it("throws ApiError when the response is missing the token field", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(godmodeLogin("oci", "oci-pass")).rejects.toBeInstanceOf(
      ApiError
    );
  });

  it("propagates network errors", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", mockFetch);

    await expect(godmodeLogin("oci", "oci-pass")).rejects.toThrow("offline");
  });
});
