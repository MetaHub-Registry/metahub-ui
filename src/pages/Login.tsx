import { useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api";

export function Login() {
  useEffect(() => {
    // Redirect to metahub-api's OIDC login endpoint
    window.location.href = `${getApiBaseUrl()}/api/v1/login`;
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Redirecting to login...</p>
    </div>
  );
}
