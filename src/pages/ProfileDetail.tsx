import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProfileDetail } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ManipulationCard } from "@/components/ManipulationCard";

export function ProfileDetail() {
  const { label } = useParams<{ label: string }>();
  const navigate = useNavigate();
  const decodedLabel = label ? decodeURIComponent(label) : "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["profile-detail", decodedLabel],
    queryFn: () => fetchProfileDetail(decodedLabel),
    enabled: !!decodedLabel,
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Failed to load profile</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Profile: {data.label}
        </h1>
        {data.name && data.tag && (
          <p className="text-muted-foreground mt-1 text-sm">
            {data.name} / {data.tag}
          </p>
        )}
      </div>

      {/* Statistics */}
      <div className="flex gap-6">
        <div className="rounded-lg border px-4 py-3">
          <p className="text-muted-foreground text-xs">Collections</p>
          <p className="text-2xl font-bold">{data.collection_count}</p>
        </div>
        <div className="rounded-lg border px-4 py-3">
          <p className="text-muted-foreground text-xs">Manifests</p>
          <p className="text-2xl font-bold">{data.manifest_count}</p>
        </div>
      </div>

      {/* Matching Rules */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Matching Rules</h2>
        <div className="flex flex-wrap gap-2">
          {data.rules.map((rule) => (
            <Badge
              key={`${rule.type}-${rule.key}-${rule.value}`}
              variant="outline"
              className="font-mono text-sm"
            >
              {rule.type}:{rule.key} {rule.op} {rule.value}
            </Badge>
          ))}
          {data.rules.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No rules defined for this profile.
            </p>
          )}
        </div>
      </div>

      {/* Manipulations */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Manipulations</h2>
        {data.manipulations && data.manipulations.length > 0 ? (
          <div className="space-y-2">
            {data.manipulations.map((mp) => (
              <ManipulationCard key={mp.label} manipulation={mp} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No manipulations linked to this profile.
          </p>
        )}
      </div>

      <button
        onClick={() =>
          navigate(
            `/collections?profile=${encodeURIComponent(data.label)}`
          )
        }
        className="text-primary text-sm underline"
      >
        Browse collections filtered by this profile &rarr;
      </button>
    </div>
  );
}
