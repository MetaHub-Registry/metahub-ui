import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchModel, fetchConfigBlobContent, ApiError } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/CopyButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ModelDetail is the model "card" — a HuggingFace-style detail page for one model
// (`/models/:ref`). It renders the `GET /api/v1/models/:ref` payload: every
// quantization grouped under the one model (layer image + size), the per-profile
// runtime configs the publisher pushed, the profiles it is served under, and the
// source artefact. Runtime containers + one-click compositions land in Phase 2.
export function ModelDetail() {
  const { ref } = useParams<{ ref: string }>();
  const name = ref ? decodeURIComponent(ref) : "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["model", name],
    queryFn: () => fetchModel(name),
    enabled: name !== "",
  });
  const model = data?.model;

  const [configOverlay, setConfigOverlay] = useState<{
    repo: string;
    tag: string;
  } | null>(null);

  const configBlobQuery = useQuery({
    queryKey: ["config-blob", configOverlay?.repo, configOverlay?.tag],
    queryFn: () =>
      fetchConfigBlobContent(configOverlay!.repo, configOverlay!.tag),
    enabled: configOverlay !== null,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  // A 404 is the "no such model" case; anything else is a real error.
  if ((error instanceof ApiError && error.status === 404) || (!error && !model)) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        <p className="text-lg font-medium">Model not found</p>
        <p className="mt-1 text-sm">
          <Link to="/models" className="text-primary underline">
            Back to Models
          </Link>
        </p>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Failed to load model</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="space-y-2">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Link to="/models" className="hover:text-foreground">
            Models
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{model.name}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{model.name}</h1>

        {/* Summary: quant count + total size */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span>
            {model.quantizations.length} quantization
            {model.quantizations.length === 1 ? "" : "s"}
          </span>
          {model.total_size ? (
            <>
              <span>·</span>
              <span data-testid="model-total-size">
                {formatBytes(model.total_size)} total
              </span>
            </>
          ) : null}
        </div>

        {model.profiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Served under:</span>
            {model.profiles.map((p) => (
              <Link
                key={p}
                to={`/profiles/${encodeURIComponent(p)}`}
                data-testid="detail-profile-link"
              >
                <Badge variant="default" className="text-xs">
                  {p}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {model.source_artifact && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Source artifact:</span>
            <Link
              to={`/oras/${model.source_artifact.repo}`}
              className="text-primary font-mono hover:underline"
            >
              {model.source_artifact.repo}
            </Link>
          </div>
        )}
      </div>

      {/* Quantizations */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base font-medium">
            Quantizations{" "}
            <span className="text-muted-foreground font-normal">
              ({model.quantizations.length})
            </span>
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          {model.quantizations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No quantizations published yet.
            </p>
          ) : (
            <table className="w-full text-sm" data-testid="quant-table">
              <thead>
                <tr className="text-muted-foreground text-left text-xs">
                  <th className="py-1 font-medium">Quantization</th>
                  <th className="py-1 font-medium">Size</th>
                  <th className="py-1 font-medium">Layer image</th>
                  <th className="py-1 font-medium">Digest</th>
                </tr>
              </thead>
              <tbody>
                {model.quantizations.map((img) => (
                  <tr
                    key={`${img.repo}:${img.tag}`}
                    className="border-border/50 border-t"
                    data-testid="quant-row"
                  >
                    <td className="py-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {img.tag}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground py-2 text-xs">
                      {img.size ? formatBytes(img.size) : "—"}
                    </td>
                    <td className="text-muted-foreground py-2 font-mono text-xs">
                      {img.repo}
                    </td>
                    <td className="py-2">
                      {img.digest ? (
                        <span className="flex items-center gap-1 font-mono text-xs">
                          {img.digest.replace("sha256:", "").slice(0, 12)}
                          <CopyButton text={img.digest} />
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Per-profile configuration (config/<name>) */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base font-medium">
            Configuration{" "}
            <span className="text-muted-foreground font-normal">
              ({model.configs.length})
            </span>
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          {model.configs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No per-profile configuration pushed. The publisher can push a
              config alongside the model to tune it per hardware profile.
            </p>
          ) : (
            <div className="space-y-3">
              {model.configs.map((cfg) => (
                <div
                  key={cfg.profile}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                  data-testid="detail-config-row"
                >
                  <Link
                    to={`/profiles/${encodeURIComponent(cfg.profile)}`}
                    data-testid="config-profile-link"
                  >
                    <Badge variant="default" className="text-xs">
                      {cfg.profile}
                    </Badge>
                  </Link>
                  {cfg.repo && (
                    <span className="text-muted-foreground font-mono">
                      {cfg.repo}
                      {cfg.tag ? (
                        <>
                          <span>:</span>
                          <span className="text-primary">{cfg.tag}</span>
                        </>
                      ) : null}
                    </span>
                  )}
                  {cfg.config_dir && (
                    <span className="text-muted-foreground font-mono">
                      → {cfg.config_dir}
                    </span>
                  )}
                  {cfg.repo && cfg.tag && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 px-2 text-xs"
                      onClick={() =>
                        setConfigOverlay({ repo: cfg.repo!, tag: cfg.tag! })
                      }
                      data-testid="show-config-btn"
                    >
                      show config
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Run this model — compositions auto-derived from referrers(model) */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base font-medium">
            Run this model{" "}
            <span className="text-muted-foreground font-normal">
              ({model.compositions.length})
            </span>
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          {model.compositions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No compositions published yet. Pull a runtime container under one of
              the profiles above — the model and its config are injected at pull
              time. A publisher can push a config artefact (subject→the model) to
              register a composition here.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs">
                Each composition bundles a quantization, a hardware profile's
                config, and a runtime container. Pull the runtime under the
                profile — MetaHub injects the model and config at pull time.
              </p>
              <table className="w-full text-sm" data-testid="composition-table">
                <thead>
                  <tr className="text-muted-foreground text-left text-xs">
                    <th className="py-1 font-medium">Profile</th>
                    <th className="py-1 font-medium">Quant</th>
                    <th className="py-1 font-medium">Runtime</th>
                    <th className="py-1 font-medium">Config</th>
                  </tr>
                </thead>
                <tbody>
                  {model.compositions.map((c) => (
                    <tr
                      key={c.config_digest ?? `${c.profile}:${c.quant}`}
                      className="border-border/50 border-t"
                      data-testid="composition-row"
                    >
                      <td className="py-2">
                        {c.profile ? (
                          <Link
                            to={`/profiles/${encodeURIComponent(c.profile)}`}
                            data-testid="composition-profile-link"
                          >
                            <Badge variant="default" className="text-xs">
                              {c.profile}
                            </Badge>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        {c.quant ? (
                          <Badge variant="secondary" className="font-mono text-xs">
                            {c.quant}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="text-muted-foreground py-2 font-mono text-xs">
                        {c.runtime || "—"}
                      </td>
                      <td className="py-2 font-mono text-xs">
                        {c.config_repo ? (
                          <Link
                            to={`/oras/${c.config_repo}`}
                            className="text-primary hover:underline"
                            data-testid="composition-config-link"
                          >
                            {c.config_repo}
                            {c.config_tag ? `:${c.config_tag}` : null}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {model.compositions.some((c) => c.runtime_image) ? (
                <div className="space-y-2" data-testid="run-snippets">
                  {model.compositions
                    .filter((c) => c.runtime_image)
                    .map((c) => {
                      const cmd = `docker run --gpus all -p 8080:8080 ${c.runtime_image}`;
                      return (
                        <div
                          key={c.config_digest ?? c.runtime_image}
                          className="space-y-1"
                          data-testid="run-snippet"
                        >
                          <div className="text-muted-foreground text-xs">
                            {c.profile}
                            {c.quant ? ` · ${c.quant}` : ""} — pulled under the
                            profile; MetaHub injects the model and config at pull
                            time
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted overflow-x-auto rounded px-2 py-1 font-mono text-xs">
                              {cmd}
                            </code>
                            <CopyButton text={cmd} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Register a runtime (<span className="font-mono">metahub-admin
                  runtime register</span>) to get a copy-paste run command here.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Dialog
        open={configOverlay !== null}
        onOpenChange={(open) => {
          if (!open) setConfigOverlay(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {configOverlay?.repo}:{configOverlay?.tag}
            </DialogTitle>
          </DialogHeader>
          {configBlobQuery.isLoading && (
            <Skeleton className="h-32 w-full" />
          )}
          {configBlobQuery.error && (
            <p className="text-destructive text-sm">
              {configBlobQuery.error instanceof Error
                ? configBlobQuery.error.message
                : "Failed to load config"}
            </p>
          )}
          {configBlobQuery.data && (
            <pre className="bg-muted max-h-96 overflow-auto rounded p-4 font-mono text-xs whitespace-pre-wrap">
              {configBlobQuery.data}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
