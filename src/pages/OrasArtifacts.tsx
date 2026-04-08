import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchOrasArtifacts } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function OrasArtifacts() {
  const location = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");

  // Extract the path from /oras/... to use as repo prefix
  const repoPrefix = location.pathname
    .replace(/^\/oras\/?/, "")
    .replace(/\/$/, "");

  const { data, isLoading, error } = useQuery({
    queryKey: ["oras", repoPrefix],
    queryFn: () => fetchOrasArtifacts(repoPrefix),
  });

  const filteredItems = useMemo(() => {
    if (!data?.next) return [];
    const entries = Object.entries(data.next);
    if (!filter) return entries;
    const lower = filter.toLowerCase();
    return entries.filter(([key]) => key.toLowerCase().includes(lower));
  }, [data?.next, filter]);

  const handleItemClick = (
    key: string,
    item: { repo: string; artifact_type: string; artifact_count: number }
  ) => {
    if (item.artifact_type) {
      // Leaf: artifact type — navigate to detail
      const params = new URLSearchParams({
        repo: item.repo,
        type: item.artifact_type,
      });
      navigate(`/oras/artifact?${params.toString()}`);
    } else {
      // Namespace segment — drill deeper
      const newPath = repoPrefix ? `${repoPrefix}/${key}` : key;
      navigate(`/oras/${newPath}`);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Failed to load ORAS artifacts</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artifacts</h1>
          <p className="text-muted-foreground text-sm">
            Browse ORAS artifacts stored in the registry
          </p>
        </div>
      </div>

      {/* Breadcrumbs */}
      {data?.bread_crumbs && data.bread_crumbs.length > 0 && (
        <Breadcrumbs crumbs={data.bread_crumbs} section="oras" />
      )}

      {/* Search / Filter */}
      <Input
        placeholder="Filter artifacts..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      {/* Artifact List */}
      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          <p className="text-lg font-medium">No artifacts found</p>
          {filter && (
            <p className="mt-1 text-sm">
              Try clearing the filter or{" "}
              <button
                onClick={() => setFilter("")}
                className="text-primary underline"
              >
                reset search
              </button>
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {filteredItems.map(([key, item]) => (
            <Card
              key={key}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleItemClick(key, item)}
            >
              <CardHeader className="flex-row items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <CardTitle className="text-base font-medium">
                    {item.artifact_type ? (
                      <span>
                        <span className="text-muted-foreground">{item.repo}</span>
                        <span className="text-muted-foreground"> · </span>
                        <span className="text-primary font-mono text-sm">{item.artifact_type}</span>
                      </span>
                    ) : (
                      key
                    )}
                  </CardTitle>
                  {!item.artifact_type && (
                    <CardDescription className="text-xs">
                      Navigate deeper
                    </CardDescription>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.artifact_count > 0 && (
                    <Badge variant="secondary">
                      {item.artifact_count} artifact
                      {item.artifact_count !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {!item.artifact_type && (
                    <span className="text-muted-foreground text-sm">&rarr;</span>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
