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

export interface UserSession {
  id: string;
  login: string;
  avatar: string;
}

export interface BreadCrumb {
  crumb: string;
  active: boolean;
  link: string;
  tag: string;
  repo: string;
  idx: number;
}

export interface CollectionNext {
  repo: string;
  tag: string;
  col_id: string;
  tag_id: string;
  col_count: number;
  mani_count: number;
}

export interface CollectionListResponse {
  next: Record<string, CollectionNext>;
  breadcrumbs: BreadCrumb[];
  slug: string;
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
  name: string;
  tag: string;
  manifests: Manifest[];
  breadcrumbs: BreadCrumb[];
}

export interface UserSecret {
  id: string;
  name: string;
  created_at: string;
}

// ─── API Functions ──────────────────────────────────────────────

export function fetchCollections(repoPrefix: string) {
  return apiFetch<CollectionListResponse>("/api/v1/collections", {
    method: "POST",
    body: JSON.stringify({ repo_prefix: repoPrefix }),
  });
}

export function fetchCollection(
  repoName: string,
  tagName: string,
  collectionId?: string,
  tagId?: string
) {
  const body: Record<string, string> = {};
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
  return apiFetch<UserSecret[]>("/api/v1/protected/user/secrets");
}

export function createUserSecret(name: string) {
  return apiFetch<{ secret: string; id: string }>(
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
