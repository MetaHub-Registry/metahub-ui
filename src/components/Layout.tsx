import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/collections", label: "Collections" },
  { to: "/oras", label: "Artifacts" },
  { to: "/profiles", label: "Profiles" },
];

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col">
      {/* Navigation Bar */}
      <header className="border-border bg-background sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:gap-6">
          {/* Logo / App Name */}
          <Link
            to="/"
            className="text-foreground text-lg font-semibold tracking-tight"
          >
            MetaHub
          </Link>

          {/* Mobile hamburger */}
          <button
            className="text-muted-foreground hover:text-foreground ml-auto md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileMenuOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <>
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  location.pathname.startsWith(link.to) &&
                    "bg-muted text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Spacer (desktop only) */}
          <div className="hidden flex-1 md:block" />

          {/* User Section (desktop) */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/settings"
                  className={cn(
                    "text-muted-foreground hover:text-foreground text-sm font-medium transition-colors",
                    location.pathname === "/settings" && "text-foreground"
                  )}
                >
                  Settings
                </Link>
                <span className="text-foreground text-sm font-medium">
                  {user.login}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                render={<Link to="/login" />}
              >
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-border border-t px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname.startsWith(link.to) &&
                      "bg-muted text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Settings
                  </Link>
                  <div className="border-border mt-2 flex items-center justify-between border-t pt-2">
                    <span className="text-foreground px-3 text-sm font-medium">
                      {user.login}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-primary rounded-md px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-7xl px-4 py-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-border border-t py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Christian Kniep. All rights reserved.</span>
          <span>v{__APP_VERSION__}</span>
        </div>
      </footer>
    </div>
  );
}
