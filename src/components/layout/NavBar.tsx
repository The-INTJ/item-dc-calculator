"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contest/contexts/auth/AuthContext";
import { useRecentContest } from "@/contest/lib/hooks/useRecentContest";
import { navItems } from "./navItems";

function isActiveLink(pathname: string, href: string) {
  if (href === "/contest") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export function NavBar() {
  const pathname = usePathname();
  const { role, loading } = useAuth();
  const isAdmin = role === "admin";
  const recentContest = useRecentContest();

  const recentContestHref = recentContest ? `/contest/${recentContest.id}` : null;
  const showRecentContest =
    recentContest != null &&
    recentContestHref != null &&
    pathname !== recentContestHref;

  return (
    <nav className="site-nav">
      {showRecentContest && (
        <Link
          href={recentContestHref}
          className="site-nav__link site-nav__link--secondary"
          title={recentContest.name}
        >
          {truncate(recentContest.name, 24)}
        </Link>
      )}
      {navItems.map((item) => {
        if (item.requiresAdmin && (loading || !isAdmin)) {
          return null;
        }
        const isActive = isActiveLink(pathname, item.href);
        const className = [
          "site-nav__link",
          item.variant === "secondary" ? "site-nav__link--secondary" : "",
          isActive ? "site-nav__link--active" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <Link key={item.key} href={item.href} className={className}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
