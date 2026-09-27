'use client';

import { useRef } from 'react';

import { pastorPage, siteLabels } from '../content';
import { useThresholdScroll } from '../use-threshold-scroll';
import { PorchScene } from './PorchScene';
import styles from './Threshold.module.scss';

/**
 * The home page's entrance. The porch is pinned while the reader scrolls: the
 * doors swing open, the view walks up the steps and through them, and the
 * light inside fills the screen with the pastor's own prayer — that Moriah's
 * light "will compel those in darkness to come in". The design is only that
 * sentence, acted out. Clicking the door makes the same walk on its own.
 */
export function Threshold() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const doorway = useRef<HTMLButtonElement>(null);
  const enter = useThresholdScroll({ section, stage, scene, doorway });

  return (
    <section ref={section} className={styles.threshold}>
      <div ref={stage} className={styles.stage}>
        <PorchScene sceneRef={scene} doorwayRef={doorway} onEnter={enter} />
        <span className={styles.flood} aria-hidden="true" />
        <figure className={styles.words}>
          <blockquote className={styles.prayer}>
            <p>{pastorPage.vision.prayer}</p>
          </blockquote>
          <figcaption className={styles.signature}>
            {pastorPage.name}, {siteLabels.pastor}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
