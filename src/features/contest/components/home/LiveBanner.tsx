import Link from 'next/link';
import type { HomepageLiveBanner } from '@/contest/lib/presentation/buildHomepageView';

interface LiveBannerProps {
  banner: HomepageLiveBanner;
}

export default function LiveBanner({ banner }: LiveBannerProps) {
  return (
    <section className="contest-live-card">
      <div className="contest-live-card__topline">
        <span className="contest-live-card__label">
          <span className="live-dot" aria-hidden="true" />
          Live now
        </span>
        <span className="badge badge--scoring badge--dot">Scoring</span>
      </div>
      <h2>{banner.contestName}</h2>
      <p>
        {banner.roundCount} rounds / {banner.entryCount} entries / Live updates
      </p>
      <Link href={banner.ctaHref} className="btn btn--accent btn--block">
        {banner.ctaLabel}
      </Link>
    </section>
  );
}
