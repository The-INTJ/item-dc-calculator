import { pricing, pmUrls } from '../content';
import styles from './PilatesMentorsDemo.module.scss';

export function PilatesMentorsPricing() {
  return (
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
  );
}
