import type { Project } from '../../content';
import styles from '../../styles/cards.module.scss';
import typo from '../../styles/type.module.scss';
import { PhotoFrame, Sticker, Tag } from '../ui/primitives';

/** One credit: still, type/platform/year, who it was for, and an optional story. */
export function ProjectCard({ project }: { project: Project }) {
  const { title, year, type, platform, director, producer, role, note, story } = project;

  return (
    <article className={styles.project}>
      <PhotoFrame
        label={`${title} — still`}
        ratio="16/9"
        radius="var(--radius-md)"
        caption={note ? <Sticker tilt={-2}>{note}</Sticker> : null}
      />
      <div className={styles.projectBody}>
        <div className={styles.tags}>
          <Tag tone="cyan">{type}</Tag>
          <Tag outline>{platform}</Tag>
          <Tag outline>{year}</Tag>
        </div>
        <h3 className={typo.cardTitle}>{title}</h3>
        <dl className={styles.credits}>
          <dt>Director</dt>
          <dd>{director}</dd>
          {producer && (
            <>
              <dt>Producer</dt>
              <dd>{producer}</dd>
            </>
          )}
          <dt>Alex was</dt>
          <dd>{role}</dd>
        </dl>
        {story && (
          <details className={styles.story}>
            <summary>
              <span className={styles.storyClosed}>+ Behind the scenes</span>
              <span className={styles.storyOpen}>– Hide the story</span>
            </summary>
            <p>{story}</p>
          </details>
        )}
      </div>
    </article>
  );
}
