import Image from 'next/image';
import {
  finalCta,
  footer,
  gap,
  hero,
  hubs,
  mentors,
  method,
  nav,
  pmUrls,
  pricing,
  testimonials,
} from '../content';
import styles from './PilatesMentorsDemo.module.scss';

/**
 * Static design preview of the redesigned pilatesmentors.com homepage.
 * Server component, zero client JS — every interactive destination links to
 * the real live site so reviewers can click through.
 */
export function PilatesMentorsDemo() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <a href={pmUrls.home} className={styles.brand}>
            <Image
              src="/pilates-mentors/owl-blue.png"
              alt=""
              width={40}
              height={40}
              className={styles.brandMark}
            />
            <span className={styles.brandName}>Pilates Mentors</span>
          </a>
          <nav className={styles.headerNav} aria-label="Sections">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className={styles.headerActions}>
            <a href={pmUrls.account} className={styles.loginLink}>
              Log in
            </a>
            <a href={pmUrls.pricing} className={styles.buttonPrimary}>
              {hero.primaryCta}
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="pm-hero-heading">
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            fill
            priority
            sizes="100vw"
            className={styles.heroBg}
          />
          <div className={styles.heroOverlay} aria-hidden="true" />
          <div className={`${styles.container} ${styles.heroContent}`}>
            <div className={styles.heroText}>
              <span className={styles.eyebrow}>{hero.eyebrow}</span>
              <h1 id="pm-hero-heading" className={styles.h1}>
                {hero.headline}
              </h1>
              <p className={styles.lede}>{hero.sub}</p>
              <div className={styles.heroCtas}>
                <a href={pmUrls.pricing} className={styles.buttonPrimary}>
                  {hero.primaryCta}
                </a>
                <a href={pmUrls.onDemand} className={styles.textLink}>
                  {hero.secondaryCta}
                </a>
              </div>
              <p className={styles.heroTrust}>{hero.trustLine}</p>
            </div>
          </div>
        </section>

        <section className={`${styles.band} ${styles.gapBand}`} aria-labelledby="pm-gap-heading">
          <div className={`${styles.container} ${styles.splitGrid}`}>
            <Image
              src={gap.image.src}
              alt={gap.image.alt}
              width={1600}
              height={2405}
              sizes="(max-width: 900px) 100vw, 40vw"
              className={styles.splitImage}
            />
            <div>
              <span className={styles.eyebrow}>{gap.eyebrow}</span>
              <h2 id="pm-gap-heading" className={styles.h2}>
                {gap.headline}
              </h2>
              <p className={styles.lede}>{gap.body}</p>
            </div>
          </div>
        </section>

        <section id="method" className={styles.band} aria-labelledby="pm-method-heading">
          <div className={styles.container}>
            <span className={styles.eyebrow}>{method.eyebrow}</span>
            <h2 id="pm-method-heading" className={styles.h2}>
              {method.headline}
            </h2>
            <div className={styles.pillarGrid}>
              {method.pillars.map((pillar) => (
                <article key={pillar.title} className={styles.pillarCard}>
                  <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                  <p className={styles.pillarBody}>{pillar.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="mentors"
          className={`${styles.band} ${styles.mentorsBand}`}
          aria-labelledby="pm-mentors-heading"
        >
          <div className={styles.container}>
            <span className={styles.eyebrow}>{mentors.eyebrow}</span>
            <h2 id="pm-mentors-heading" className={styles.h2}>
              {mentors.headline}
            </h2>
            <div className={styles.mentorGrid}>
              {mentors.people.map((person) => (
                <article key={person.name} className={styles.mentorCard}>
                  <Image
                    src={person.image.src}
                    alt={person.image.alt}
                    width={1200}
                    height={810}
                    sizes="(max-width: 700px) 100vw, 50vw"
                    className={styles.mentorPhoto}
                  />
                  <h3 className={styles.mentorName}>{person.name}</h3>
                  <p className={styles.mentorRole}>{person.role}</p>
                  <p className={styles.mentorLine}>{person.line}</p>
                </article>
              ))}
            </div>
            <dl className={styles.statRow}>
              {mentors.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className={styles.statLabel}>{stat.label}</dt>
                  <dd className={styles.statValue}>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="membership" className={styles.band} aria-labelledby="pm-hubs-heading">
          <div className={styles.container}>
            <span className={styles.eyebrow}>{hubs.eyebrow}</span>
            <h2 id="pm-hubs-heading" className={styles.h2}>
              {hubs.headline}
            </h2>
            <div className={styles.hubList}>
              {hubs.items.map((hub) => (
                <a key={hub.number} href={hub.href} className={styles.hubCard}>
                  <span className={styles.hubNumber}>{hub.number}</span>
                  <h3 className={styles.hubOutcome}>{hub.outcome}</h3>
                  <p className={styles.hubTitle}>{hub.title}</p>
                  <p className={styles.hubBody}>{hub.body}</p>
                  <span className={styles.hubLink}>Explore the hub →</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section
          id="stories"
          className={`${styles.band} ${styles.storiesBand}`}
          aria-labelledby="pm-stories-heading"
        >
          <div className={styles.container}>
            <span className={styles.eyebrow}>{testimonials.eyebrow}</span>
            <h2 id="pm-stories-heading" className={styles.h2}>
              {testimonials.headline}
            </h2>
            <div className={styles.quoteGrid}>
              {testimonials.quotes.map((item) => (
                <figure key={item.attribution} className={styles.quoteCard}>
                  <blockquote className={styles.quoteText}>{item.quote}</blockquote>
                  <figcaption className={styles.quoteAttribution}>{item.attribution}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className={styles.band} aria-labelledby="pm-pricing-heading">
          <div className={`${styles.container} ${styles.pricingGrid}`}>
            <div>
              <span className={styles.eyebrow}>{pricing.eyebrow}</span>
              <h2 id="pm-pricing-heading" className={styles.h2}>
                {pricing.headline}
              </h2>
              <p className={styles.lede}>
                One membership, every hub. Built for new instructors finding their footing and
                veterans sharpening their craft.
              </p>
            </div>
            <div className={styles.planCard}>
              <p className={styles.planName}>{pricing.planName}</p>
              <p className={styles.planPriceRow}>
                <span className={styles.planPrice}>{pricing.price}</span>
                <span className={styles.planPriceUnit}>{pricing.priceUnit}</span>
              </p>
              <p className={styles.planPriceNote}>{pricing.priceNote}</p>
              <ul className={styles.planFeatures}>
                {pricing.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a href={pmUrls.pricing} className={styles.buttonPrimary}>
                {pricing.cta}
              </a>
              <p className={styles.planFinePrint}>{pricing.finePrint}</p>
            </div>
          </div>
        </section>

        <section className={`${styles.band} ${styles.finalBand}`} aria-labelledby="pm-final-heading">
          <div className={styles.container}>
            <h2 id="pm-final-heading" className={styles.h2}>
              {finalCta.headline}
            </h2>
            <div className={styles.finalCtas}>
              <a href={pmUrls.pricing} className={styles.buttonPrimary}>
                {finalCta.cta}
              </a>
              <a href={pmUrls.onDemand} className={styles.textLink}>
                {finalCta.secondary}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerInner}>
            <a href={pmUrls.home} className={styles.brand}>
              <Image
                src="/pilates-mentors/owl-blue.png"
                alt=""
                width={40}
                height={40}
                className={styles.brandMark}
              />
              <span className={styles.brandName}>Pilates Mentors</span>
            </a>
            <nav className={styles.footerLinks} aria-label="Contact and social">
              <a href={pmUrls.email}>{footer.email}</a>
              <a href={pmUrls.instagram}>Instagram</a>
              <a href={pmUrls.facebook}>Facebook</a>
            </nav>
          </div>
          <p className={styles.footerNote}>
            {footer.note} {footer.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}
