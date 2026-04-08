import { useEffect, useState } from "react";
import { fetchAuthConfig, getApiBaseUrl, type AuthConfig } from "@/lib/api";
import { GodModeLoginForm } from "@/components/GodModeLoginForm";
import { Button } from "@/components/ui/button";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; config: AuthConfig }
  | { status: "fallback" }; // discovery failed → behave like the legacy OIDC redirect

/**
 * Redirects the browser to the metahub-api OIDC login endpoint.
 * Extracted so both the OIDC-only branch and the dual-mode "Login with
 * Authentik" button can share the same behaviour, and so tests can spy on
 * `window.location.href`.
 */
function redirectToOIDC() {
  window.location.href = `${getApiBaseUrl()}/api/v1/login`;
}

export function Login() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // Discovery effect: fetch the auth config once on mount. The setState calls
  // live inside the .then()/.catch() callbacks so the linter recognises them
  // as async-resolved updates rather than synchronous in-effect setState
  // (mirrors the existing AuthContext pattern).
  useEffect(() => {
    let cancelled = false;
    fetchAuthConfig()
      .then((config) => {
        if (!cancelled) setState({ status: "ready", config });
      })
      .catch((err) => {
        // Older metahub-api versions (or any backend error — CORS,
        // network, etc.) → fall back to the legacy OIDC redirect so we never
        // wedge the UI. Log the root cause so the fallback doesn't silently
        // mask misconfigurations like a missing `cors.enabled: true`.
        console.warn(
          "metahub: auth config discovery failed, falling back to OIDC redirect:",
          err
        );
        if (!cancelled) setState({ status: "fallback" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Trigger the OIDC redirect for both the legacy fallback and the
  // OIDC-only success path. We do this in a separate effect so the render
  // pass for the loading state runs first.
  useEffect(() => {
    if (state.status === "fallback") {
      redirectToOIDC();
      return;
    }
    if (
      state.status === "ready" &&
      state.config.oidc_enabled &&
      !state.config.godmode_enabled
    ) {
      redirectToOIDC();
    }
  }, [state]);

  if (state.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (state.status === "fallback") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  const { oidc_enabled, godmode_enabled } = state.config;

  // OIDC only → redirect (the effect above already triggered it).
  if (oidc_enabled && !godmode_enabled) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  // God-mode only → render the form.
  if (!oidc_enabled && godmode_enabled) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <GodModeLoginForm />
        </div>
      </div>
    );
  }

  // Dual mode → both options. OIDC takes visual precedence.
  if (oidc_enabled && godmode_enabled) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <Button onClick={redirectToOIDC}>Login with Authentik</Button>
          <div
            className="flex items-center gap-2 text-xs uppercase text-muted-foreground"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-border" />
            <span>or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <GodModeLoginForm />
        </div>
      </div>
    );
  }

  // Neither method enabled — extremely unusual; the API would refuse to start
  // in that mode (see godmode-auth spec) but we render a friendly message
  // rather than a blank page.
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-destructive">
        No authentication method is configured on this server.
      </p>
    </div>
  );
}
