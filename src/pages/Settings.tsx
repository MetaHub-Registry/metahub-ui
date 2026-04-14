import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRegistryTokens,
  createRegistryToken,
  deleteRegistryToken,
  getApiBaseUrl,
  type RegistryToken,
  type RegistryTokenCreateResponse,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/CopyButton";
import { fetchProfiles } from "@/lib/api";
import { toast } from "sonner";

export function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTokenDesc, setNewTokenDesc] = useState("");
  const [createdToken, setCreatedToken] =
    useState<RegistryTokenCreateResponse | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("");

  const registryHost =
    getApiBaseUrl().replace(/^https?:\/\//, "") || window.location.host;

  const {
    data: tokens,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registry-tokens"],
    queryFn: fetchRegistryTokens,
  });

  const { data: profilesData } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
  });
  const profileList = profilesData?.profiles ?? [];

  const createMutation = useMutation({
    mutationFn: (description: string) => createRegistryToken(description),
    onSuccess: (data) => {
      setCreatedToken(data);
      setNewTokenDesc("");
      queryClient.invalidateQueries({ queryKey: ["registry-tokens"] });
      toast.success("Registry token created");
    },
    onError: (err) => {
      toast.error(
        `Failed to create token: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (identifier: string) => deleteRegistryToken(identifier),
    onSuccess: () => {
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["registry-tokens"] });
      toast.success("Registry token revoked");
    },
    onError: (err) => {
      toast.error(
        `Failed to revoke token: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    },
  });

  const dockerLoginCmd = selectedProfile
    ? `docker login ${registryHost} -u ${user?.login || "<username>"}/${selectedProfile}`
    : `docker login ${registryHost} -u ${user?.login || "<username>"}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your registry credentials
        </p>
      </div>

      {/* Docker Login Command */}
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Docker Login</CardTitle>
          <CardDescription>
            Use this command to authenticate your Docker client with the
            registry
          </CardDescription>
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground text-sm">Profile:</label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="border-border bg-background text-foreground rounded-md border px-2 py-1 text-sm"
            >
              <option value="">Default (generic)</option>
              {profileList.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-muted flex items-center justify-between gap-2 rounded-md p-3">
            <code className="text-foreground break-all text-sm">
              {dockerLoginCmd}
            </code>
            <CopyButton text={dockerLoginCmd} />
          </div>
        </CardHeader>
      </Card>

      {/* Registry Tokens */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Registry Tokens</h2>
          <Dialog>
            <DialogTrigger render={<Button size="sm">Create Token</Button>} />
            <DialogContent showCloseButton={false} className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Registry Token</DialogTitle>
                <DialogDescription>
                  Create a new token for Docker registry access. You will only
                  see the token once.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Token description (e.g., my-laptop)"
                  value={newTokenDesc}
                  onChange={(e) => setNewTokenDesc(e.target.value)}
                />
                {createdToken && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-600">
                      Copy this token now — you won't be able to see it again!
                    </p>
                    <div className="bg-muted flex items-center gap-2 rounded-md p-3">
                      <code className="text-foreground flex-1 break-all text-sm">
                        {createdToken.password}
                      </code>
                      <CopyButton text={createdToken.password} />
                    </div>
                    <div className="bg-muted flex items-center gap-2 rounded-md p-3">
                      <code className="text-foreground break-all text-sm">
                        {createdToken.docker_login}
                      </code>
                      <CopyButton text={createdToken.docker_login} />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose
                  render={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreatedToken(null);
                        setNewTokenDesc("");
                      }}
                    >
                      {createdToken ? "Done" : "Cancel"}
                    </Button>
                  }
                />
                {!createdToken && (
                  <Button
                    onClick={() => createMutation.mutate(newTokenDesc)}
                    disabled={!newTokenDesc.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading tokens...</div>
        ) : error ? (
          <div className="text-destructive text-sm">
            Failed to load tokens:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        ) : tokens && tokens.length > 0 ? (
          <div className="grid gap-2">
            {tokens.map((token: RegistryToken) => (
              <Card key={token.identifier}>
                <CardHeader className="flex-row items-center justify-between py-3">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {token.identifier}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {token.description}
                    </CardDescription>
                  </div>
                  <Dialog
                    open={deleteConfirmId === token.identifier}
                    onOpenChange={(open) =>
                      setDeleteConfirmId(open ? token.identifier : null)
                    }
                  >
                    <DialogTrigger
                      render={
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setDeleteConfirmId(token.identifier)
                          }
                        >
                          Revoke
                        </Button>
                      }
                    />
                    <DialogContent showCloseButton={false}>
                      <DialogHeader>
                        <DialogTitle>Revoke Token</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to revoke &quot;
                          {token.identifier}&quot;? This action cannot be
                          undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose
                          render={<Button variant="outline">Cancel</Button>}
                        />
                        <Button
                          variant="destructive"
                          onClick={() =>
                            deleteMutation.mutate(token.identifier)
                          }
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? "Revoking..." : "Revoke"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No registry tokens yet. Create one to get started with{" "}
            <code>docker login</code>.
          </div>
        )}
      </div>
    </div>
  );
}
