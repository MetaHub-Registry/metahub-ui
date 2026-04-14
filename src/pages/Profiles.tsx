import { useNavigate } from "react-router-dom";
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

export function Profiles() {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
  });

  const profileList = data?.profiles ?? [];

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
            key={profile.label}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() =>
              navigate(
                `/profiles/${encodeURIComponent(profile.label)}`
              )
            }
          >
            <CardHeader className="gap-1 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">
                  {profile.label}
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
                {profile.name}{profile.tag ? ` / ${profile.tag}` : ""}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
