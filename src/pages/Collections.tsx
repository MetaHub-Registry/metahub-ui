import { useState, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCollections, fetchCollection } from "@/lib/api";
import type { Manifest } from "@/lib/api";
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
import { CopyButton } from "@/components/CopyButton";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

type SortKey = "platform" | "registry" | "size";

export function Collections() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("platform");
  const [sortAsc, setSortAsc] = useState(true);

  // Extract the path from /collections/... to use as repo_prefix
  const fullPath = location.pathname
    .replace(/^\/collections\/?/, "")
    .replace(/\/$/, "");

  const selectedProfile = searchParams.get("profile") || "";

  // Split the path to detect if the last segment might be a tag.
  // We first fetch using the full path as a repo prefix. If that returns
  // empty results, the last segment is likely a tag, so we fetch the parent
  // path instead and look for the tag in the result.
  const pathSegments = fullPath.split("/").filter(Boolean);
  const possibleTag = pathSegments.length >= 2
    ? pathSegments[pathSegments.length - 1]
    : "";
  const parentPath = possibleTag
    ? pathSegments.slice(0, -1).join("/")
    : "";

  // First, fetch with full path as repo prefix
  const { data, isLoading, error } = useQuery({
    queryKey: ["collections", fullPath, selectedProfile],
    queryFn: () => fetchCollections(fullPath, selectedProfile || undefined),
  });

  // If the full path returned empty results and we have a possible tag,
  // fetch the parent path to check if the last segment is a tag
  const fullPathIsEmpty = data && Object.keys(data.next || {}).length === 0;
  const shouldTryParent = fullPathIsEmpty && possibleTag && parentPath;

  const { data: parentData } = useQuery({
    queryKey: ["collections", parentPath, selectedProfile],
    queryFn: () => fetchCollections(parentPath, selectedProfile || undefined),
    enabled: !!shouldTryParent,
  });

  // Determine which data to use for navigation and whether we're viewing a tag
  const effectiveData = shouldTryParent && parentData ? parentData : data;
  const repoPrefix = shouldTryParent && parentData ? parentPath : fullPath;

  // Check if the last segment matches a tag in the parent's next entries
  const selectedTagEntry = useMemo(() => {
    if (!shouldTryParent || !parentData?.next) return null;
    const entry = Object.entries(parentData.next).find(
      ([key, item]) => item.tag && key === possibleTag
    );
    return entry || null;
  }, [shouldTryParent, parentData?.next, possibleTag]);

  // Fetch collection detail when a tag is selected (name-based)
  const repoName = selectedTagEntry
    ? selectedTagEntry[1].repo
    : "";
  const tagName = selectedTagEntry
    ? selectedTagEntry[1].tag
    : "";

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["collection", repoName, tagName],
    queryFn: () => fetchCollection(repoName, tagName),
    enabled: !!selectedTagEntry && !!repoName && !!tagName,
  });

  // Filter the next items by search term
  const filteredItems = useMemo(() => {
    if (!effectiveData?.next) return [];
    const entries = Object.entries(effectiveData.next);
    if (!filter) return entries;
    const lower = filter.toLowerCase();
    return entries.filter(([key]) => key.toLowerCase().includes(lower));
  }, [effectiveData?.next, filter]);

  // Build the profile query string with proper URL encoding so that
  // labels containing '#' (e.g. cpu#zen2) become cpu%23zen2 in the URL
  // instead of being interpreted as a fragment identifier.
  const profileQuery = selectedProfile
    ? `?profile=${encodeURIComponent(selectedProfile)}`
    : "";

  const handleItemClick = (key: string, item: { repo: string; tag: string; collection_id: number; tag_id: number; collection_count: number; manifest_count: number }) => {
    if (item.tag) {
      // This is a tag — navigate to name-based collection detail URL.
      // Use the full repo from item.repo (not repoPrefix) to handle
      // single-segment repos like "alpine" where the tag appears at
      // the same breadcrumb level as the repo name.
      const newPath = `${item.repo}/${item.tag}`;
      navigate(`/collections/${newPath}${profileQuery}`);
    } else {
      // This is a namespace/repo — drill down
      const newPath = repoPrefix ? `${repoPrefix}/${key}` : key;
      navigate(`/collections/${newPath}${profileQuery}`);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(true);
    }
  };

  // Sort manifests for the detail view
  const sortedManifests = useMemo(() => {
    if (!detailData?.collection?.manifests) return [];
    const sorted = [...detailData.collection.manifests].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "platform":
          cmp = `${a.platform.os}/${a.platform.architecture}`.localeCompare(
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
  }, [detailData?.collection?.manifests, sortBy, sortAsc]);

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

  // ─── Collection Detail View ───────────────────────────────────
  if (selectedTagEntry && detailData?.collection) {
    const collection = detailData.collection;
    return (
      <div className="space-y-6">
        {/* Breadcrumbs */}
        {detailData.bread_crumbs && detailData.bread_crumbs.length > 0 && (
          <Breadcrumbs crumbs={detailData.bread_crumbs} profile={selectedProfile} section="collections" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {collection.name}
              <span className="text-muted-foreground">:</span>
              <span className="text-primary">{collection.tag}</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {collection.manifests.length} image
              {collection.manifests.length !== 1 ? "s" : ""} in this collection
            </p>
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
              {sortBy === key && (sortAsc ? " ↑" : " ↓")}
            </button>
          ))}
        </div>

        {/* Manifest List */}
        <div className="grid gap-2">
          {sortedManifests.map((manifest) => (
            <ManifestRow key={manifest.digest} manifest={manifest} />
          ))}
        </div>
      </div>
    );
  }

  // Show loading for detail view
  if (selectedTagEntry && detailLoading) {
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

  // ─── Collection Listing View ──────────────────────────────────
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
      {effectiveData?.bread_crumbs && effectiveData.bread_crumbs.length > 0 && (
        <Breadcrumbs crumbs={effectiveData.bread_crumbs} profile={selectedProfile} section="collections" />
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
                      {item.collection_count > 0 && (
                        <span>{item.collection_count} collection{item.collection_count !== 1 ? "s" : ""}</span>
                      )}
                    </CardDescription>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.manifest_count > 0 && (
                    <Badge variant="secondary">
                      {item.manifest_count} image{item.manifest_count !== 1 ? "s" : ""}
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

function ManifestRow({ manifest }: { manifest: Manifest }) {
  const platformStr = [
    manifest.platform.os,
    manifest.platform.architecture,
    manifest.platform.variant,
  ]
    .filter(Boolean)
    .join("/");

  const digestShort = manifest.digest.replace("sha256:", "").slice(0, 12);
  // Show content_size (aggregated blobs) when available and positive,
  // otherwise fall back to size (manifest JSON). Use whichever is larger
  // to avoid showing a misleadingly small number for tiny test images.
  // content_size can be negative (-1 per blob) when blob sizes haven't synced yet.
  const contentSize = manifest.content_size && manifest.content_size > 0 ? manifest.content_size : 0;
  const manifestSize = manifest.size && manifest.size > 0 ? manifest.size : 0;
  const displaySize = Math.max(contentSize, manifestSize);
  const sizeStr = displaySize ? formatBytes(displaySize) : "unknown size";
  const hasProfiles = manifest.profiles && manifest.profiles.length > 0 && manifest.profiles.some(Boolean);
  const hasFeatures = manifest.platform.features && manifest.platform.features.length > 0;

  // Shorten digest in upstream reference for display
  const upstreamDisplay = manifest.upstream
    ? manifest.upstream.replace(/(sha256:)([a-f0-9]{12})[a-f0-9]+/g, "$1$2")
    : "";

  return (
    <Card>
      <CardHeader className="gap-2 py-3">
        {/* Row 1: Platform + Digest + Size */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-medium">
              {platformStr}
            </Badge>
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="text-muted-foreground">sha256:</span>
              <span>{digestShort}</span>
              <CopyButton text={manifest.digest} />
            </div>
          </div>
          <span className="text-muted-foreground shrink-0 text-sm">
            {sizeStr}
          </span>
        </div>

        {/* Row 2: Upstream source — only for images pulled from an external registry */}
        {manifest.upstream && manifest.registry && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <span>Upstream:</span>
            <code className="bg-muted rounded px-1 py-0.5 font-mono">
              {upstreamDisplay}
            </code>
            <CopyButton text={manifest.upstream} />
          </div>
        )}

        {/* Row 3: Profiles + Features (when present) */}
        {(hasProfiles || hasFeatures) && (
          <div className="flex flex-wrap items-center gap-2">
            {hasProfiles && (
              <>
                <span className="text-muted-foreground text-xs">Profiles:</span>
                {manifest.profiles!.map((p) => (
                  <Badge key={p} variant="default" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </>
            )}
            {hasFeatures && (
              <>
                <span className="text-muted-foreground text-xs">Features:</span>
                {manifest.platform.features!.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs">
                    {f}
                  </Badge>
                ))}
              </>
            )}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
