import type { HomepageWelcome } from '@/contest/lib/presentation/buildHomepageView';

interface WelcomeBannerProps {
  welcome: HomepageWelcome;
}

export default function WelcomeBanner({ welcome }: WelcomeBannerProps) {
  return (
    <section className="contest-hero contest-home__hero">
      <p className="eyebrow contest-home__eyebrow">Welcome back</p>
      <h1>
        <span>{welcome.displayName}</span>
      </h1>
    </section>
  );
}
