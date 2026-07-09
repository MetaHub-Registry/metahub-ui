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
  slug_end: string | number;
}

export interface ApiDescriptor {
  digest: string;
  media_type: string;
  size: number;
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
  content_size?: number;
  registry: string;
  upstream?: string;
  annotations?: Record<string, string>;
  profiles?: string[];
  // cpu_target is the structured CPU optimization parsed from the
  // org.supercontainers.hardware.cpu.target* annotations (when present).
  // Lets the UI distinguish otherwise-identical platform rows, e.g. a
  // zen2-optimized amd64 image from a plain amd64 one.
  cpu_target?: CPUTarget;
  config?: ApiDescriptor;
  layers?: ApiDescriptor[];
}

export interface CPUTarget {
  kind?: string;
  microarch?: string;
  generic?: string;
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

// ─── ORAS Types ─────────────────────────────────────────────────

export interface OrasListing {
  repo: string;
  artifact_type: string;
  artifact_count: number;
}

export interface OrasBlob {
  digest: string;
  media_type: string;
  size: number;
  title: string;
  annotations: Record<string, string>;
}

export interface OrasArtifact {
  id: number;
  repo: string;
  digest: string;
  media_type: string;
  artifact_type: string;
  annotations: Record<string, string>;
  subject?: Manifest;
  blobs: OrasBlob[];
}

export interface OrasListResponse {
  next: Record<string, OrasListing>;
  bread_crumbs: BreadCrumb[];
  slug_end: number;
}

export interface OrasArtifactResponse {
  artifact: OrasArtifact;
  bread_crumbs: BreadCrumb[];
}

// ─── Collections API calls ──────────────────────────────────────

export function fetchCollections(repoPrefix: string, profile?: string) {
  const body: Record<string, string> = { repo: repoPrefix };
  if (profile) {
    body.profile = profile;
  }
  return apiFetch<CollectionListResponse>("/api/v1/collections", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchCollection(
  repoName: string,
  tagName: string,
  collectionId?: number,
  tagId?: number,
  profile?: string
) {
  const body: Record<string, string | number> = {};
  if (collectionId && tagId) {
    body.collection_id = collectionId;
    body.tag_id = tagId;
  } else {
    body.repo_name = repoName;
    body.tag_name = tagName;
  }
  // When a profile is selected, ask the server to narrow the manifests
  // to that profile. The handler (RepoGetOne) filters server-side; the
  // UI no longer post-filters. Empty/undefined profile = no filter.
  if (profile) {
    body.profile = profile;
  }
  return apiFetch<CollectionDetailResponse>("/api/v1/collection", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchOrasArtifacts(repoPrefix: string) {
  const params = repoPrefix ? `?repo=${encodeURIComponent(repoPrefix)}` : "";
  return apiFetch<OrasListResponse>(`/api/v1/oras${params}`);
}

export function fetchOrasArtifact(repo: string, artifactType: string) {
  const params = new URLSearchParams({ repo, artifact_type: artifactType });
  return apiFetch<OrasArtifactResponse>(`/api/v1/oras/artifact?${params.toString()}`);
}

// ─── Models API ─────────────────────────────────────────────────
// A model is a `model/<name>` manipulation produced by `metahub-admin
// repackage`. Its repackaged model-layer images are excluded from collections
// and surfaced in the Models tab instead.

export interface ModelImageRef {
  repo: string; // e.g. models/qwen3-8b-layer
  tag: string; // quantization tag, e.g. q8-kxl
  digest: string;
  size?: number; // model-layer tar blob size in bytes (the model weight)
}

export interface ModelSourceArtifact {
  repo: string; // e.g. e2e-models/e2e-gguf35
  digest: string;
}

export interface ModelListing {
  name: string; // <name> from the model/<name> label
  label: string; // full manipulation label, model/<name>
  profiles: string[]; // VRAM profile labels that inject the model
  images: ModelImageRef[]; // repackaged model-layer image variant(s)
  total_size?: number; // sum of the distinct quantizations' sizes
  // Source ORAS artifact linked via the model-layer image's OCI subject
  // reference; absent for models repackaged before subject refs were emitted.
  source_artifact?: ModelSourceArtifact;
}

export interface ModelListResponse {
  models: ModelListing[];
}

// ModelProfileConfig is the runtime config a publisher pushed for a model under a
// hardware profile (the `config/<name>` manipulation): the config image and the
// in-image dir the base image reads it from (QNIB_MODEL_CONFIG_DIR).
export interface ModelProfileConfig {
  profile: string; // profile label, e.g. vram#12gb
  repo?: string; // config image repo, models/<name>-config
  tag?: string; // quantization tag
  digest?: string;
  config_dir?: string; // QNIB_MODEL_CONFIG_DIR
}

// ModelComposition is a runnable bundle auto-derived from a model's referrers: a
// config artefact (subject→a quant) + its {profile, runtime, quant} annotations
// and the config image it repackages into. The runtime is the application
// container the config names.
export interface ModelComposition {
  profile?: string;
  quant?: string;
  runtime?: string;
  runtime_image?: string; // resolved runtime image ref (from the registry)
  config_repo?: string;
  config_tag?: string;
  config_digest?: string;
}

// ModelDetail is the card payload for one model (GET /api/v1/models/:ref): every
// quantization grouped under it (layer image + size), the per-profile configs,
// the compositions (referrers-derived), the profiles it is served under, and the
// source ORAS artifact.
export interface ModelDetail {
  name: string;
  label: string;
  profiles: string[];
  quantizations: ModelImageRef[];
  configs: ModelProfileConfig[];
  compositions: ModelComposition[];
  total_size?: number;
  source_artifact?: ModelSourceArtifact;
}

export interface ModelDetailResponse {
  model: ModelDetail;
}

export function fetchModels() {
  return apiFetch<ModelListResponse>("/api/v1/models");
}

export function fetchModel(ref: string) {
  // Model refs are org-qualified (`qnib/minicpm5`) and the API route is
  // path-segmented (/api/v1/models/<org>/<name>). Encode each segment but KEEP
  // the `/` separators — encodeURIComponent(ref) turns `/` into %2F, which the
  // API 307-redirects (Location = the decoded path), and the card fails to load.
  const path = ref.split("/").map(encodeURIComponent).join("/");
  return apiFetch<ModelDetailResponse>(`/api/v1/models/${path}`);
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

// ─── Auth-mode discovery & god-mode login ───────────────────────

export interface AuthConfig {
  oidc_enabled: boolean;
  godmode_enabled: boolean;
}

/**
 * Fetches the public auth-mode discovery endpoint so the UI can decide which
 * login flow to render. The call is intentionally unauthenticated and does
 * NOT use `apiFetch` (which would attach a stale Bearer token).
 *
 * Throws ApiError on any non-2xx response or network failure.
 */
export async function fetchAuthConfig(): Promise<AuthConfig> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/auth/config`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(text || response.statusText, response.status);
  }
  const data = (await response.json()) as Partial<AuthConfig>;
  if (
    typeof data?.oidc_enabled !== "boolean" ||
    typeof data?.godmode_enabled !== "boolean"
  ) {
    throw new ApiError("malformed auth config response", 502);
  }
  return { oidc_enabled: data.oidc_enabled, godmode_enabled: data.godmode_enabled };
}

/**
 * Exchanges god-mode credentials for a metahub-api JWT via
 * `POST /api/v1/godmode/login`. The call is unauthenticated — we deliberately
 * skip `apiFetch` so no stale Bearer token is attached.
 *
 * Throws ApiError on any non-2xx response. Callers should branch on
 * `error.status` (401 → bad credentials, 404 → god-mode disabled server-side).
 */
export async function godmodeLogin(
  username: string,
  password: string
): Promise<{ token: string }> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/godmode/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(text || response.statusText, response.status);
  }
  const data = (await response.json()) as { token?: string };
  if (!data?.token) {
    throw new ApiError("missing token in login response", 502);
  }
  return { token: data.token };
}

// ─── Profiles API ────────────────────────────────────────────────

export interface ApiProfileRule {
  id: number;
  type: string;
  op: string;
  key: string;
  value: string;
}

export interface ApiProfile {
  id: number;
  name: string;
  tag: string;
  label: string;
  rules: ApiProfileRule[];
}

export interface ProfilesResponse {
  profiles: ApiProfile[];
}

export function fetchProfiles() {
  return apiFetch<ProfilesResponse>("/api/v1/profiles");
}

export type ApiManipuCmdOp = "replace" | "prepend" | "append";

export interface ApiManipuCommand {
  op: ApiManipuCmdOp;
  value: string[];
}

export interface ApiManipuLayer {
  image?: string;
  rule?: string;
  upstream?: string;
  /**
   * Optional Python-style slice expression (e.g. "[1:]", "[0]",
   * "[-1]") that trims which layers from the source image the
   * manipulation actually appends at apply time. Absent or empty
   * means "all layers".
   */
  select?: string;
}

export interface ApiManipuConfig {
  env?: Record<string, string>;
  workdir?: string;
  user?: string;
  volumes?: string[];
  entrypoint?: ApiManipuCommand;
  cmd?: ApiManipuCommand;
  layers?: ApiManipuLayer[];
}

export interface ApiManipuVariant {
  rule: string;
  config: ApiManipuConfig;
}

export interface ApiManipulation {
  id: number;
  label: string;
  default?: ApiManipuConfig;
  variants?: ApiManipuVariant[];
  layers?: ApiManipuLayer[];
}

export interface ProfileDetailResponse {
  id: number;
  name: string;
  tag: string;
  label: string;
  rules: ApiProfileRule[];
  collection_count: number;
  manifest_count: number;
  manipulations: ApiManipulation[];
}

export function fetchProfileDetail(label: string) {
  return apiFetch<ProfileDetailResponse>(
    `/api/v1/profiles/${encodeURIComponent(label)}`
  );
}

// VersionResponse is the shape returned by `GET /api/v1/version`.
// Both fields are always present; empty strings are legitimate for
// older images that predate the handler (the UI falls back to an
// em-dash in that case so the operator sees a deterministic "not
// reported" state rather than a crash).
export interface VersionResponse {
  api: string;
  metalib: string;
}

export function fetchVersion() {
  return apiFetch<VersionResponse>("/api/v1/version");
}

// ─── Config blob content ─────────────────────────────────────────
// Fetches a model config layer's text content via the API proxy endpoint
// (GET /api/v1/manifest/blob-content?repo=&ref=) which uses API JWT auth,
// avoiding the separate OCI Bearer auth flow the browser cannot perform.

export async function fetchConfigBlobContent(
  repo: string,
  ref: string
): Promise<string> {
  const params = new URLSearchParams({ repo, ref });
  const res = await apiFetch<{ content: string }>(
    `/api/v1/manifest/blob-content?${params.toString()}`
  );
  return res.content;
}
