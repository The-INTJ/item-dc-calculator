"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useAuth } from "@/contest/contexts/auth/AuthContext";
import { useContestStore } from "@/contest/contexts/contest/ContestContext";
import { getRoundById } from "@/contest/lib/domain/contestGetters";
import { phaseLabels } from "@/contest/lib/domain/contestPhases";
import { navItems } from "./navItems";

function isActiveLink(pathname: string, href: string) {
  if (href === "/contest") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function NavBar() {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const { role, loading } = useAuth();
  const { contests } = useContestStore();
  const isAdmin = role === "admin";
  const contestParam = typeof params.id === "string" ? params.id : null;
  const activeContest = contestParam
    ? contests.find((contest) => contest.id === contestParam || contest.slug === contestParam) ?? null
    : null;
  const activeRound = activeContest ? getRoundById(activeContest, activeContest.activeRoundId) : null;
  const phase = activeRound?.state ?? activeContest?.phase ?? null;
  const phaseLabel = phase ? phaseLabels[phase] : null;

  return (
    <nav className="site-nav">
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
      <div className="site-nav__status" aria-live="polite">
        {phaseLabel && phase && (
          <span className={`site-nav__phase site-nav__phase--${phase}`}>
            {phaseLabel}
          </span>
        )}
      </div>
    </nav>
  );
}
