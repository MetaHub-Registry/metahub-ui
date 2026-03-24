import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Landing() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/collections" replace />;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">MetaHub</h1>
      <p className="text-muted-foreground text-lg">
        Container image registry with profile-aware image indexes
      </p>
      <Button render={<Link to="/login" />}>Login with Authentik</Button>
    </div>
  );
}
