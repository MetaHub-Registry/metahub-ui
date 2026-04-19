import { useQuery } from "@tanstack/react-query";
import { fetchVersion, type VersionResponse } from "@/lib/api";

interface VersionFooterProps {
  /** The UI's own version injected at build time by Vite. */
  uiVersion: string;
}

// Display format:  ui v3.1.0-dev2 • api v3.1.0-dev2 • metalib v3.2.0-dev2
//
// Each piece is rendered unconditionally. When the /api/v1/version
// endpoint fails or returns empty strings (older images), the
// component falls back to an em-dash for that field — surfaces a
// stale-deploy signal without crashing the footer. The query stays
// cached for 5 minutes so every page navigation doesn't re-poke the
// backend; a hard refresh picks up a fresh deploy.
export function VersionFooter({ uiVersion }: VersionFooterProps) {
  const { data } = useQuery({
    queryKey: ["version"],
    queryFn: fetchVersion,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return (
    <span
      className="font-mono text-xs text-muted-foreground"
      data-testid="version-footer"
    >
      ui v{uiVersion}
      {" · "}
      api v{displayVersion(data, "api")}
      {" · "}
      metalib v{displayVersion(data, "metalib")}
    </span>
  );
}

// displayVersion picks a version field out of the API response,
// falling back to a visible em-dash when the value is missing so
// operators see a stable "not reported" string instead of an empty
// gap that could be mistaken for a blank version.
function displayVersion(
  data: VersionResponse | undefined,
  field: keyof VersionResponse
): string {
  if (!data) return "—";
  return data[field] || "—";
}
