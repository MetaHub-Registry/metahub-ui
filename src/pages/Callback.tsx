import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function Callback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const accessToken = params.get("access_token");

    if (accessToken) {
      // Clear the token from the URL
      window.history.replaceState(null, "", window.location.pathname);
      login(accessToken);

      // Redirect to the saved return URL or collections
      const returnUrl = sessionStorage.getItem("metahub_return_url") || "/collections";
      sessionStorage.removeItem("metahub_return_url");
      navigate(returnUrl, { replace: true });
    } else {
      setError("Authentication failed. No access token received.");
    }
  }, [login, navigate]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-destructive">{error}</p>
        <a href="/login" className="text-primary underline">
          Try again
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Completing login...</p>
    </div>
  );
}
