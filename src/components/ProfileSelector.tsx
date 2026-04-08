import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProfiles } from "@/lib/api";
import { profiles as STATIC_PROFILES } from "@/data/profiles";

export function ProfileSelector() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProfile = searchParams.get("profile") || "";

  // Fetch profiles from the API; fall back to static profiles while loading or on error
  const { data } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    initialData: { profiles: STATIC_PROFILES.map((p) => ({ id: 0, name: p.name, tag: "", label: p.description, rules: [] })) },
  });

  const profileList = data?.profiles ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      setSearchParams((prev) => {
        prev.set("profile", value);
        return prev;
      });
    } else {
      setSearchParams((prev) => {
        prev.delete("profile");
        return prev;
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="profile-select" className="text-muted-foreground text-sm">
        Profile:
      </label>
      <select
        id="profile-select"
        value={selectedProfile}
        onChange={handleChange}
        className="border-border bg-background text-foreground rounded-md border px-2 py-1 text-sm"
      >
        <option value="">All Profiles</option>
        {profileList.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
