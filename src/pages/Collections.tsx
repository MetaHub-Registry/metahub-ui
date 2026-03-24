import { useState, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCollections, type CollectionNext } from "@/lib/api";
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
import { ProfileSelector } from "@/components/ProfileSelector";

export function Collections() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState("");

  // Extract the path from /collections/... to use as repo_prefix
  const repoPrefix = location.pathname
    .replace(/^\/collections\/?/, "")
    .replace(/\/$/, "");

  const selectedProfile = searchParams.get("profile") || "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["collections", repoPrefix],
    queryFn: () => fetchCollections(repoPrefix),
  });

  // Filter the next items by search term
  const filteredItems = useMemo(() => {
    if (!data?.next) return [];
    const entries = Object.entries(data.next);
    if (!filter) return entries;
    const lower = filter.toLowerCase();
    return entries.filter(([key]) => key.toLowerCase().includes(lower));
  }, [data?.next, filter]);

  const handleItemClick = (key: string, item: CollectionNext) => {
    if (item.tag) {
      // This is a tag — navigate to collection detail
      navigate(
        `/collection/${encodeURIComponent(item.col_id)}/tag/${encodeURIComponent(item.tag_id)}${selectedProfile ? `?profile=${selectedProfile}` : ""}`
      );
    } else {
      // This is a namespace/repo — drill down
      const newPath = repoPrefix ? `${repoPrefix}/${key}` : key;
      navigate(`/collections/${newPath}${selectedProfile ? `?profile=${selectedProfile}` : ""}`);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Failed to load collections</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground text-sm">
            Browse container image collections
          </p>
        </div>
        <ProfileSelector />
      </div>

      {/* Breadcrumbs */}
      {data?.breadcrumbs && data.breadcrumbs.length > 0 && (
        <Breadcrumbs crumbs={data.breadcrumbs} profile={selectedProfile} />
      )}

      {/* Search / Filter */}
      <Input
        placeholder="Filter collections..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      {/* Collection List */}
      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          <p className="text-lg font-medium">No collections found</p>
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
                    {item.tag ? (
                      <span>
                        {item.repo}
                        <span className="text-muted-foreground">:</span>
                        <span className="text-primary">{item.tag}</span>
                      </span>
                    ) : (
                      key
                    )}
                  </CardTitle>
                  {!item.tag && (
                    <CardDescription className="text-xs">
                      {item.col_count > 0 && (
                        <span>{item.col_count} collection{item.col_count !== 1 ? "s" : ""}</span>
                      )}
                    </CardDescription>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.mani_count > 0 && (
                    <Badge variant="secondary">
                      {item.mani_count} image{item.mani_count !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {!item.tag && (
                    <span className="text-muted-foreground text-sm">
                      &rarr;
                    </span>
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
