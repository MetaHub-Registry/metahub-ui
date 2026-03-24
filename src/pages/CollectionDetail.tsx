import { useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCollection, type Manifest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProfileSelector } from "@/components/ProfileSelector";
import { CopyButton } from "@/components/CopyButton";
import {
  getProfileByName,
  manifestMatchesProfile,
} from "@/data/profiles";
import { cn } from "@/lib/utils";

type SortKey = "platform" | "registry" | "size";

export function CollectionDetail() {
  const { id, tagId } = useParams<{ id: string; tagId: string }>();
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<SortKey>("platform");
  const [sortAsc, setSortAsc] = useState(true);

  const selectedProfile = searchParams.get("profile") || "";
  const profile = selectedProfile
    ? getProfileByName(selectedProfile)
    : undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ["collection", id, tagId],
    queryFn: () => fetchCollection("", "", id!, tagId!),
    enabled: !!id && !!tagId,
  });

  const sortedManifests = useMemo(() => {
    if (!data?.manifests) return [];
    const sorted = [...data.manifests].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "platform":
          cmp =
            `${a.platform.os}/${a.platform.architecture}`.localeCompare(
              `${b.platform.os}/${b.platform.architecture}`
            );
          break;
        case "registry":
          cmp = (a.registry || "").localeCompare(b.registry || "");
          break;
        case "size":
          cmp = (a.size || 0) - (b.size || 0);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [data?.manifests, sortBy, sortAsc]);

  const matchCount = useMemo(() => {
    if (!profile || !data?.manifests) return 0;
    return data.manifests.filter((m) => manifestMatchesProfile(m, profile))
      .length;
  }, [data?.manifests, profile]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(true);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Failed to load collection</p>
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
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {data.breadcrumbs && data.breadcrumbs.length > 0 && (
        <Breadcrumbs crumbs={data.breadcrumbs} profile={selectedProfile} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {data.name}
            <span className="text-muted-foreground">:</span>
            <span className="text-primary">{data.tag}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {data.manifests.length} image
            {data.manifests.length !== 1 ? "s" : ""} in this collection
          </p>
          {profile && (
            <p className="text-muted-foreground mt-1 text-sm">
              <span className="text-primary font-medium">{matchCount}</span> of{" "}
              {data.manifests.length} images included in the{" "}
              <span className="font-medium">{profile.name}</span> index
            </p>
          )}
        </div>
        <ProfileSelector />
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Sort by:</span>
        {(["platform", "registry", "size"] as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={cn(
              "rounded-md px-2 py-1 capitalize transition-colors",
              sortBy === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {key}
            {sortBy === key && (sortAsc ? " \u2191" : " \u2193")}
          </button>
        ))}
      </div>

      {/* Manifest List */}
      <div className="grid gap-2">
        {sortedManifests.map((manifest) => {
          const matches = profile
            ? manifestMatchesProfile(manifest, profile)
            : true;
          return (
            <ManifestRow
              key={manifest.digest}
              manifest={manifest}
              highlighted={matches}
              dimmed={!!profile && !matches}
            />
          );
        })}
      </div>
    </div>
  );
}

function ManifestRow({
  manifest,
  highlighted,
  dimmed,
}: {
  manifest: Manifest;
  highlighted: boolean;
  dimmed: boolean;
}) {
  const platformStr = [
    manifest.platform.os,
    manifest.platform.architecture,
    manifest.platform.variant,
  ]
    .filter(Boolean)
    .join("/");

  const digestShort = manifest.digest.replace("sha256:", "").slice(0, 12);
  const sizeStr = manifest.size
    ? formatBytes(manifest.size)
    : "unknown size";

  return (
    <Card
      className={cn(
        "transition-opacity",
        dimmed && "opacity-40",
        highlighted && "border-primary/30 bg-primary/5"
      )}
    >
      <CardHeader className="flex-row items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <Badge variant={dimmed ? "outline" : "secondary"}>{platformStr}</Badge>
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="text-muted-foreground">sha256:</span>
            <span>{digestShort}</span>
            <CopyButton text={manifest.digest} />
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{sizeStr}</span>
          {manifest.registry && (
            <Badge variant="outline">{manifest.registry}</Badge>
          )}
          {manifest.platform.features &&
            manifest.platform.features.length > 0 && (
              <div className="flex gap-1">
                {manifest.platform.features.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs">
                    {f}
                  </Badge>
                ))}
              </div>
            )}
        </div>
      </CardHeader>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
