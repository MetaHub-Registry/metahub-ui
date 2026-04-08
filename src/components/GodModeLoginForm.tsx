import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { godmodeLogin, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Form for exchanging god-mode credentials for a metahub-api JWT.
 *
 * Used by the Login page when the backend reports `godmode_enabled=true`
 * (see `fetchAuthConfig`). On success the token is stored via
 * `AuthContext.login(token)` and the user is navigated to either the
 * remembered return URL or `/collections`.
 *
 * Errors are mapped to user-friendly messages:
 *  - HTTP 401 → "Invalid username or password"
 *  - HTTP 404 → "God-mode login is disabled on this server"
 *  - other / network errors → "Login failed, please try again"
 */
export function GodModeLoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (!username.trim() || !password) {
      setError("Username and password are required");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const { token } = await godmodeLogin(username.trim(), password);
      login(token);

      const returnUrl =
        sessionStorage.getItem("metahub_return_url") || "/collections";
      sessionStorage.removeItem("metahub_return_url");
      navigate(returnUrl, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Invalid username or password");
        } else if (err.status === 404) {
          setError("God-mode login is disabled on this server");
        } else {
          setError("Login failed, please try again");
        }
      } else {
        setError("Login failed, please try again");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-3"
      aria-label="God-mode login"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="godmode-username" className="text-sm font-medium">
          Username
        </label>
        <Input
          id="godmode-username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="godmode-password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="godmode-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm text-destructive"
          data-testid="godmode-login-error"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
