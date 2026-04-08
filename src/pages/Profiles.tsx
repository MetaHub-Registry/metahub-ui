import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchProfiles } from "@/lib/api";
import { profiles as STATIC_PROFILES } from "@/data/profiles";

export function Profiles() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();

  // Fetch profiles from the API; fall back to static profiles while loading
  const { data } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    initialData: {
      profiles: STATIC_PROFILES.map((p) => ({
        id: 0,
        name: p.name,
        tag: "",
        label: p.description,
        rules: p.rules.map((r, i) => ({ id: i, type: r.type, op: r.op, key: r.key, value: r.value })),
      })),
    },
  });

  const profileList = data?.profiles ?? [];

  // If a specific profile is selected, show its detail
  const selectedProfile = name ? profileList.find((p) => p.name === name) : undefined;

  if (selectedProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Profile: {selectedProfile.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {selectedProfile.label}
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Matching Rules</h2>
          <div className="flex flex-wrap gap-2">
            {selectedProfile.rules.map((rule) => (
              <Badge key={`${rule.type}-${rule.key}-${rule.value}`} variant="outline" className="font-mono text-sm">
                {rule.type}:{rule.key} {rule.op} {rule.value}
              </Badge>
            ))}
            {selectedProfile.rules.length === 0 && (
              <p className="text-muted-foreground text-sm">No rules defined for this profile.</p>
            )}
          </div>
        </div>

        <button
          onClick={() =>
            navigate(
              `/collections?profile=${encodeURIComponent(selectedProfile.name)}`
            )
          }
          className="text-primary text-sm underline"
        >
          Browse collections filtered by this profile &rarr;
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profiles</h1>
        <p className="text-muted-foreground text-sm">
          Image profiles determine which container image variant is served based
          on hardware capabilities
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profileList.map((profile) => (
          <Card
            key={profile.name}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() =>
              navigate(
                `/collections?profile=${encodeURIComponent(profile.name)}`
              )
            }
          >
            <CardHeader className="gap-1 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">
                  {profile.name}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <div className="flex gap-1">
                        {profile.rules.map((rule) => (
                          <Badge
                            key={`${rule.type}-${rule.key}`}
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {rule.type}:{rule.key}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                  <TooltipContent>
                    <div className="space-y-1">
                      {profile.rules.map((rule) => (
                        <p key={`${rule.type}-${rule.key}-${rule.value}`} className="text-xs">
                          {rule.type}:{rule.key} {rule.op} {rule.value}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription className="text-xs">
                {profile.label}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
