import { Link } from "react-router-dom";
import type { BreadCrumb } from "@/lib/api";
interface BreadcrumbsProps {
  crumbs: BreadCrumb[];
  profile?: string;
}

export function Breadcrumbs({ crumbs, profile }: BreadcrumbsProps) {
  const profileParam = profile ? `?profile=${profile}` : "";

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        to={`/collections${profileParam}`}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Home
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="text-muted-foreground">/</span>
          {crumb.active ? (
            <span className="text-foreground font-medium">{crumb.crumb}</span>
          ) : (
            <Link
              to={`/collections/${crumb.link}${profileParam}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.crumb}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
