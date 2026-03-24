import { useParams, useNavigate } from "react-router-dom";
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
import { profiles, getProfileByName } from "@/data/profiles";

export function Profiles() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();

  // If a specific profile is selected, show its detail
  const selectedProfile = name ? getProfileByName(name) : undefined;

  if (selectedProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Profile: {selectedProfile.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {selectedProfile.description}
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Matching Rules</h2>
          <div className="flex flex-wrap gap-2">
            {selectedProfile.rules.map((rule, i) => (
              <Badge key={i} variant="outline" className="font-mono text-sm">
                {rule.type}:{rule.key} {rule.op} {rule.value}
              </Badge>
            ))}
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
        {profiles.map((profile) => (
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
                        {profile.rules.map((rule, i) => (
                          <Badge
                            key={i}
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
                      {profile.rules.map((rule, i) => (
                        <p key={i} className="text-xs">
                          {rule.type}:{rule.key} {rule.op} {rule.value}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription className="text-xs">
                {profile.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
