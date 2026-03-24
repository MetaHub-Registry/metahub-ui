// API client module for metahub-api
// Handles base URL configuration, Bearer token injection, and 401 handling.

const API_BASE_URL_KEY = "metahub_api_base_url";
const TOKEN_KEY = "metahub_access_token";

/**
 * Returns the metahub-api base URL.
 * In production, this is set via environment variable substitution at container startup.
 * In development, the Vite proxy forwards /api/ to the local API.
 */
export function getApiBaseUrl(): string {
  // Check for runtime config (set by docker-entrypoint.sh)
  const runtime = (window as unknown as Record<string, unknown>)
    .__METAHUB_API_URL__ as string | undefined;
  if (runtime && !runtime.startsWith("__")) {
    return runtime.replace(/\/$/, "");
  }

  // Check localStorage override (useful for development)
  const stored = localStorage.getItem(API_BASE_URL_KEY);
  if (stored) {
    return stored.replace(/\/$/, "");
  }

  // Default: same origin (works with Vite proxy in dev)
  return "";
}

/**
 * Get the stored access token.
 */
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Store the access token.
 */
export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear the stored access token.
 */
export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

// Callback for handling 401 responses (set by AuthContext)
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void): void {
  onUnauthorized = callback;
}

/**
 * Type-safe API request wrapper.
 * Automatically attaches Bearer token and handles 401 responses.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    onUnauthorized?.();
    throw new ApiError("Unauthorized", 401);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(text || response.statusText, response.status);
  }

  // Handle empty responses (204, etc.)
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ─── API Types ──────────────────────────────────────────────────
// Field names match the actual metahub-api JSON responses.

export interface UserSession {
  id: string;
  login: string;
  avatar: string;
}

export interface BreadCrumb {
  crumb: string;
  active: number; // API returns int (0/1), not boolean
  link: string;
  tag: string;
  repo: string;
  idx: number;
}

export interface CollectionNext {
  repo: string;
  tag: string;
  collection_id: number;
  tag_id: number;
  collection_count: number;
  manifest_count: number;
}

export interface CollectionListResponse {
  next: Record<string, CollectionNext>;
  bread_crumbs: BreadCrumb[];
  slug_end: string;
}

export interface Manifest {
  digest: string;
  media_type: string;
  platform: {
    os: string;
    architecture: string;
    variant?: string;
    features?: string[];
  };
  size: number;
  registry: string;
  annotations?: Record<string, string>;
}

export interface CollectionDetailResponse {
  collection: {
    name: string;
    tag: string;
    manifests: Manifest[];
  };
  repos: string[];
  bread_crumbs: BreadCrumb[];
}

export interface UserSecret {
  id: number;
  name: string;
  secret_key: string;
  is_copied: boolean;
  created_at: string;
}

export interface RegistryToken {
  identifier: string;
  description: string;
}

export interface RegistryTokenCreateResponse {
  identifier: string;
  description: string;
  docker_login: string;
  username: string;
  password: string;
}

// ─── API Functions ──────────────────────────────────────────────

export function fetchCollections(repoPrefix: string) {
  return apiFetch<CollectionListResponse>("/api/v1/collections", {
    method: "POST",
    body: JSON.stringify({ repo: repoPrefix }),
  });
}

export function fetchCollection(
  repoName: string,
  tagName: string,
  collectionId?: number,
  tagId?: number
) {
  const body: Record<string, string | number> = {};
  if (collectionId && tagId) {
    body.collection_id = collectionId;
    body.tag_id = tagId;
  } else {
    body.repo_name = repoName;
    body.tag_name = tagName;
  }
  return apiFetch<CollectionDetailResponse>("/api/v1/collection", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchSession() {
  return apiFetch<UserSession>("/api/v1/protected/session");
}

export function fetchLogout() {
  return apiFetch<void>("/api/v1/protected/logout");
}

export function fetchUserSecrets() {
  return apiFetch<{ name: string; secret_key: string }>(
    "/api/v1/protected/user/secret",
    { method: "PUT", body: JSON.stringify({ name: "__list__" }) }
  );
}

export function createUserSecret(name: string) {
  return apiFetch<{ name: string; secret_key: string }>(
    "/api/v1/protected/user/secret",
    {
      method: "PUT",
      body: JSON.stringify({ name }),
    }
  );
}

export function deleteUserSecret(id: string) {
  return apiFetch<void>(`/api/v1/protected/user/secret/${id}`, {
    method: "DELETE",
  });
}

// ─── Registry Token API (Authentik app passwords) ───────────────

export function fetchRegistryTokens() {
  return apiFetch<RegistryToken[]>("/api/v1/protected/registry-tokens");
}

export function createRegistryToken(description: string) {
  return apiFetch<RegistryTokenCreateResponse>(
    "/api/v1/protected/registry-token",
    {
      method: "POST",
      body: JSON.stringify({ description }),
    }
  );
}

export function deleteRegistryToken(identifier: string) {
  return apiFetch<void>(
    `/api/v1/protected/registry-tokens/${encodeURIComponent(identifier)}`,
    { method: "DELETE" }
  );
}
