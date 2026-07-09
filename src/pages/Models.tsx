import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchModels } from "@/lib/api";
import type { ModelListing } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/CopyButton";
import { formatBytes } from "@/lib/utils";

export function Models() {
  const [filter, setFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
  });

  const models = useMemo(() => {
    const all = data?.models ?? [];
    if (!filter) return all;
    const lower = filter.toLowerCase();
    return all.filter((m) => m.name.toLowerCase().includes(lower));
  }, [data?.models, filter]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Failed to load models</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Models</h1>
        <p className="text-muted-foreground text-sm">
          AI models repackaged into injectable layers, served per VRAM profile
        </p>
      </div>

      {/* Search / Filter */}
      <Input
        placeholder="Filter models..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      {/* Model List */}
      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          <p className="text-lg font-medium">No models found</p>
          {filter ? (
            <p className="mt-1 text-sm">
              Try clearing the filter or{" "}
              <button
                onClick={() => setFilter("")}
                className="text-primary underline"
              >
                reset search
              </button>
            </p>
          ) : (
            <p className="mt-1 text-sm">
              Repackage an ORAS model artifact to publish a model here.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {models.map((model) => (
            <ModelCard key={model.label} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModelCard({ model }: { model: ModelListing }) {
  return (
    <Card data-testid="model-card">
      <CardHeader className="gap-3 py-3">
        {/* Name → model card */}
        <CardTitle className="text-base font-medium">
          <Link
            to={`/models/${encodeURIComponent(model.name)}`}
            data-testid="model-card-link"
            className="hover:underline"
          >
            {model.name}
          </Link>
        </CardTitle>

        {/* Overview: quantization count + total size (HF org-repo style) */}
        <div
          className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
          data-testid="model-card-overview"
        >
          <span>
            {model.images.length} quantization
            {model.images.length === 1 ? "" : "s"}
          </span>
          {model.total_size ? (
            <>
              <span>·</span>
              <span data-testid="model-card-size">
                {formatBytes(model.total_size)}
              </span>
            </>
          ) : null}
        </div>

        {/* Profiles that inject the model */}
        {model.profiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Injected for:</span>
            {model.profiles.map((p) => (
              <Link
                key={p}
                to={`/profiles/${encodeURIComponent(p)}`}
                data-testid="model-profile-link"
              >
                <Badge variant="default" className="text-xs">
                  {p}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Source ORAS artifact (via the OCI subject reference) */}
        {model.source_artifact && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Source artifact:</span>
            <Link
              to={`/oras/${model.source_artifact.repo}`}
              data-testid="model-source-link"
              className="text-primary font-mono hover:underline"
            >
              {model.source_artifact.repo}
            </Link>
          </div>
        )}

        {/* Repackaged model-layer image variant(s) */}
        {model.images.length > 0 && (
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Layer images:</span>
            {model.images.map((img) => (
              <div
                key={`${img.repo}:${img.tag}`}
                className="flex items-center gap-2 font-mono text-xs"
              >
                <span>
                  {img.repo}
                  <span className="text-muted-foreground">:</span>
                  <span className="text-primary">{img.tag}</span>
                </span>
                {img.digest && <CopyButton text={img.digest} />}
              </div>
            ))}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
