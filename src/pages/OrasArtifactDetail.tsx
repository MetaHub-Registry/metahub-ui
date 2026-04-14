import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchOrasArtifact } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CopyButton } from "@/components/CopyButton";

export function OrasArtifactDetail() {
  const [searchParams] = useSearchParams();
  const repo = searchParams.get("repo") ?? "";
  const artifactType = searchParams.get("type") ?? "";

  const paramsValid = repo !== "" && artifactType !== "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["oras-artifact", repo, artifactType],
    queryFn: () => fetchOrasArtifact(repo, artifactType),
    enabled: paramsValid,
  });

  if (!paramsValid) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Missing required parameters</p>
        <p className="text-muted-foreground text-sm">
          Both <code>repo</code> and <code>type</code> query parameters are required.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Failed to load artifact</p>
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
            <Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.artifact) return null;

  const artifact = data.artifact;
  const digestShort = artifact.digest.replace("sha256:", "").slice(0, 12);
  const annotations = artifact.annotations ?? {};
  const hasAnnotations = Object.keys(annotations).length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {data.bread_crumbs && data.bread_crumbs.length > 0 && (
        <Breadcrumbs crumbs={data.bread_crumbs} section="oras" />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{artifact.repo}</h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{artifact.artifact_type}</Badge>
          {artifact.media_type && (
            <Badge variant="outline" className="font-mono text-xs">
              {artifact.media_type}
            </Badge>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 font-mono text-sm text-muted-foreground">
          <span>sha256:</span>
          <span>{digestShort}</span>
          <CopyButton text={artifact.digest} />
        </div>
      </div>

      {/* Subject reference */}
      {artifact.subject && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Subject</h2>
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{artifact.subject.media_type}</Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {artifact.subject.digest.replace("sha256:", "").slice(0, 12)}
                </span>
                <CopyButton text={artifact.subject.digest} />
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Annotations */}
      {hasAnnotations && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Annotations</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Key</th>
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(annotations).map(([key, value]) => (
                  <tr key={key} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{key}</td>
                    <td className="px-4 py-2 font-mono text-xs">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Layers */}
      {artifact.blobs && artifact.blobs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            Layers
            <span className="text-muted-foreground text-base font-normal ml-2">
              ({artifact.blobs.length})
            </span>
          </h2>
          <div className="grid gap-2">
            {artifact.blobs.map((blob) => {
              const blobDigestShort = blob.digest.replace("sha256:", "").slice(0, 12);
              const sizeStr = blob.size ? formatBytes(blob.size) : "unknown size";
              const hasTitle = blob.title && blob.title.length > 0;
              return (
                <Card key={blob.digest}>
                  <CardHeader className="flex-row items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      {hasTitle ? (
                        <>
                          <span className="text-sm font-medium">
                            {blob.title}
                          </span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {blob.media_type}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="font-mono text-xs">
                          {blob.media_type}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <span className="text-muted-foreground">sha256:</span>
                        <span>{blobDigestShort}</span>
                        <CopyButton text={blob.digest} />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{sizeStr}</span>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
