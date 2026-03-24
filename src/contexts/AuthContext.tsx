import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  getToken,
  setToken as storeToken,
  clearToken,
  setOnUnauthorized,
  fetchSession,
  fetchLogout,
  type UserSession,
} from "@/lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserSession | null;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(!!getToken());
  const navigate = useNavigate();

  const isAuthenticated = !!token && !isLoading;

  const handleUnauthorized = useCallback(() => {
    setTokenState(null);
    setUser(null);
    clearToken();
    navigate("/login");
  }, [navigate]);

  // Register the 401 handler with the API client
  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  // Validate token on mount / token change
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setUser(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchSession()
      .then((session) => {
        if (!cancelled) {
          setUser(session);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Token is invalid
          setTokenState(null);
          setUser(null);
          clearToken();
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback((newToken: string) => {
    storeToken(newToken);
    setTokenState(newToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetchLogout();
    } catch {
      // Ignore logout API errors
    }
    setTokenState(null);
    setUser(null);
    clearToken();
    navigate("/");
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
