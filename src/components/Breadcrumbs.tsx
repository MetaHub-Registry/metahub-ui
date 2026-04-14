import { Link } from "react-router-dom";
import type { BreadCrumb } from "@/lib/api";

interface BreadcrumbsProps {
  readonly crumbs: BreadCrumb[];
  readonly profile?: string;
  /** The section this breadcrumb belongs to. Controls the URL prefix for links.
   *  Defaults to "collections" for backward compatibility. */
  readonly section?: "collections" | "oras";
}

export function Breadcrumbs({ crumbs, profile, section = "collections" }: BreadcrumbsProps) {
  const profileParam = profile ? `?profile=${encodeURIComponent(profile)}` : "";
  const base = `/${section}`;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        to={`${base}${profileParam}`}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Home
      </Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.link || crumb.crumb} className="flex items-center gap-1">
            <span className="text-muted-foreground">/</span>
            {isLast ? (
              <span className="text-foreground font-medium">{crumb.crumb}</span>
            ) : (
              <Link
                to={`${base}/${crumb.link}${profileParam}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.crumb}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
