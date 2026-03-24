import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getApiBaseUrl,
  getToken,
  setToken,
  clearToken,
  apiFetch,
  ApiError,
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
