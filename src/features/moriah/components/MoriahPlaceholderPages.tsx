import { formatLongDate } from '../calendar-grid';
import { blogPage, church, givePage } from '../content';
import styles from './MoriahDemo.module.scss';

/**
 * The two pages the church has written nothing for. Both are lorem ipsum
 * behind a notice, and every block carries a placeholder pill — this preview
 * goes in front of a pastor, and nothing on it may read as his words.
 */
export function MoriahBlog() {
  return (
    <section className={styles.band} aria-labelledby="mo-blog-heading">
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>{blogPage.eyebrow}</span>
          <h1 id="mo-blog-heading" className={styles.h1}>
            {blogPage.headline}
          </h1>
          <p className={styles.notice}>{blogPage.notice}</p>
        </div>

        <div className={styles.blogGrid}>
          {blogPage.posts.map((post) => (
            <article key={post.id} className={styles.blogCard}>
              <div className={styles.blogCardHead}>
                <span className={styles.newsDate}>{formatLongDate(post.date)}</span>
                <span className={styles.placeholderTag}>{blogPage.placeholderTag}</span>
              </div>
              <h2 className={styles.blogTitle}>{post.title}</h2>
              <p className={styles.blogExcerpt}>{post.excerpt}</p>
              <span className={styles.blogMore}>Read more</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MoriahGive() {
  return (
    <section className={styles.band} aria-labelledby="mo-give-heading">
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>{givePage.eyebrow}</span>
          <h1 id="mo-give-heading" className={styles.h1}>
            {givePage.headline}
          </h1>
          <p className={styles.notice}>{givePage.notice}</p>
        </div>

        <div className={styles.giveGrid}>
          <div>
            <p className={styles.lede}>
              {givePage.body}
              <span className={styles.placeholderTag}>{givePage.placeholderTag}</span>
            </p>
            <div className={styles.giveMethods}>
              {givePage.methods.map((method) => (
                <div key={method.id} className={styles.giveMethod}>
                  <h2 className={styles.pointTitle}>{method.title}</h2>
                  <p className={styles.pointBody}>{method.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.contactCard}>
            <p className={styles.contactLabel}>{givePage.byMailLabel}</p>
            <address className={styles.addressBlock}>
              {church.name}
              <br />
              {church.address.street}
              <br />
              {church.address.city}, {church.address.state} {church.address.zip}
            </address>
          </div>
        </div>
      </div>
    </section>
  );
}
