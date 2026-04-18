import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import type {
  ApiManipulation,
  ApiManipuCommand,
  ApiManipuConfig,
  ApiManipuLayer,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ManipulationCardProps {
  manipulation: ApiManipulation;
}

// ManipulationCard renders one manipulation as a collapsible card. It
// handles three shapes:
//   - extended: `default` and/or `variants` populated
//   - variants-only: `default` empty, `variants` populated
//   - legacy: flat `layers` slice populated (no default, no variants)
export function ManipulationCard({ manipulation }: ManipulationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDefault =
    !!manipulation.default && !isConfigEmpty(manipulation.default);
  const hasVariants = !!manipulation.variants && manipulation.variants.length > 0;
  const hasLegacyLayers =
    !hasDefault && !hasVariants && !!manipulation.layers && manipulation.layers.length > 0;
  const subtitleParts: string[] = [];
  if (hasDefault) subtitleParts.push("default");
  if (hasVariants)
    subtitleParts.push(
      `${manipulation.variants!.length} variant${manipulation.variants!.length === 1 ? "" : "s"}`
    );
  if (hasLegacyLayers) subtitleParts.push("legacy layers");
  const subtitle = subtitleParts.join(" \u00b7 ") || "empty";

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/40"
      >
        <div className="flex flex-col gap-1">
          <span className="font-mono text-sm font-medium">{manipulation.label}</span>
          <span className="text-muted-foreground text-xs">{subtitle}</span>
        </div>
        <ChevronDownIcon
          className={cn(
            "size-4 transition-transform",
            expanded ? "rotate-180" : undefined
          )}
        />
      </button>
      {expanded && (
        <div className="space-y-4 border-t px-4 py-4">
          {hasDefault && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Default</h3>
              <ManipuConfigBlock config={manipulation.default!} />
            </section>
          )}
          {hasVariants && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Variants</h3>
              <div className="space-y-3">
                {manipulation.variants!.map((v) => (
                  <div key={v.rule} className="rounded-md border p-3">
                    <div className="mb-2">
                      <Badge
                        variant="outline"
                        className="font-mono text-xs"
                      >
                        {v.rule}
                      </Badge>
                    </div>
                    <ManipuConfigBlock config={v.config} />
                  </div>
                ))}
              </div>
            </section>
          )}
          {hasLegacyLayers && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Layers (legacy form)</h3>
              <LegacyLayerList layers={manipulation.layers!} />
            </section>
          )}
          {!hasDefault && !hasVariants && !hasLegacyLayers && (
            <p className="text-muted-foreground text-sm">
              No payload on this manipulation.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function isConfigEmpty(cfg: ApiManipuConfig): boolean {
  if (cfg.workdir || cfg.user) return false;
  if (cfg.env && Object.keys(cfg.env).length > 0) return false;
  if (cfg.volumes && cfg.volumes.length > 0) return false;
  if (cfg.entrypoint || cfg.cmd) return false;
  if (cfg.layers && cfg.layers.length > 0) return false;
  return true;
}

function ManipuConfigBlock({ config }: { config: ApiManipuConfig }) {
  const envEntries = config.env ? Object.entries(config.env) : [];
  return (
    <div className="space-y-3">
      {(config.workdir || config.user) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {config.workdir && (
            <Badge variant="secondary" className="font-mono">
              workdir: {config.workdir}
            </Badge>
          )}
          {config.user && (
            <Badge variant="secondary" className="font-mono">
              user: {config.user}
            </Badge>
          )}
        </div>
      )}
      {envEntries.length > 0 && (
        <div>
          <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
            Env
          </h4>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {envEntries.map(([k, v]) => (
                  <tr key={k} className="border-t first:border-t-0">
                    <td className="px-3 py-1 font-mono text-muted-foreground">{k}</td>
                    <td className="px-3 py-1 font-mono">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {config.volumes && config.volumes.length > 0 && (
        <div>
          <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
            Volumes
          </h4>
          <div className="flex flex-wrap gap-1">
            {config.volumes.map((vol) => (
              <Badge key={vol} variant="outline" className="font-mono text-xs">
                {vol}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {config.entrypoint && (
        <CommandBlock title="Entrypoint" cmd={config.entrypoint} />
      )}
      {config.cmd && <CommandBlock title="Cmd" cmd={config.cmd} />}
      {config.layers && config.layers.length > 0 && (
        <div>
          <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
            Layers
          </h4>
          <LegacyLayerList layers={config.layers} />
        </div>
      )}
    </div>
  );
}

function CommandBlock({ title, cmd }: { title: string; cmd: ApiManipuCommand }) {
  return (
    <div>
      <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
        {title}
      </h4>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default" className="font-mono text-xs uppercase">
          {cmd.op}
        </Badge>
        <code className="text-xs">{JSON.stringify(cmd.value)}</code>
      </div>
    </div>
  );
}

function LegacyLayerList({ layers }: { layers: ApiManipuLayer[] }) {
  return (
    <ul className="space-y-1">
      {layers.map((lyr, idx) => (
        <li
          key={`${lyr.image ?? lyr.upstream ?? "layer"}-${lyr.rule ?? idx}`}
          className="flex flex-wrap items-center gap-2 text-xs"
        >
          {lyr.rule && (
            <Badge variant="outline" className="font-mono">
              {lyr.rule}
            </Badge>
          )}
          {lyr.image && <span className="font-mono">{lyr.image}</span>}
          {!lyr.image && lyr.upstream && (
            <span className="font-mono text-muted-foreground">{lyr.upstream}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
