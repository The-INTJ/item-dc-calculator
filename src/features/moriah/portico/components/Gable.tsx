import Link from 'next/link';
import type { CSSProperties } from 'react';

import { lockup, porticoLabels } from '../content';
import {
  BANDS,
  OCULUS,
  PEDIMENT_H,
  PEDIMENT_W,
  rakeBand,
  rakeLine,
  tympanum,
} from '../pediment-geometry';
import { PORTICO_PATH } from '../routes';
import styles from './Gable.module.scss';
import { Oculus } from './Oculus';

/** Clapboard course height, in viewBox units — about thirteen courses, as on the building. */
const COURSE = 22;
const TYMPANUM = tympanum();
const FASCIA = rakeBand(0, BANDS.fascia);
const ROOF = rakeBand(BANDS.fascia, BANDS.roof);
const RAKE = rakeBand(BANDS.roof, BANDS.rake);

/** Where the vent sits, as percentages of the drawing, so it scales with it. */
const oculusBox = {
  '--oc-left': `${((OCULUS.cx - OCULUS.r) / PEDIMENT_W) * 100}%`,
  '--oc-top': `${((OCULUS.cy - OCULUS.r) / PEDIMENT_H) * 100}%`,
  '--oc-size': `${((OCULUS.r * 2) / PEDIMENT_W) * 100}%`,
} as CSSProperties;

function PedimentDrawing() {
  return (
    <svg
      className={styles.pediment}
      viewBox={`0 0 ${PEDIMENT_W} ${PEDIMENT_H}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="gable-board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdfcf8" />
          <stop offset="1" stopColor="#e7e8ec" />
        </linearGradient>
        <pattern id="gable-clapboard" patternUnits="userSpaceOnUse" width={PEDIMENT_W} height={COURSE}>
          <rect width={PEDIMENT_W} height={COURSE} fill="url(#gable-board)" />
          <rect y={COURSE - 1.7} width={PEDIMENT_W} height="1.7" fill="#8a8fa6" opacity="0.5" />
          <rect width={PEDIMENT_W} height="0.9" fill="#ffffff" />
        </pattern>
        <linearGradient id="gable-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff6e2" stopOpacity="0.6" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#5f6582" stopOpacity="0.2" />
        </linearGradient>
        <filter id="gable-soffit" x="-4%" y="-6%" width="108%" height="130%">
          <feDropShadow dx="0" dy="7" stdDeviation="5.5" floodColor="#2b2f43" floodOpacity="0.4" />
        </filter>
      </defs>

      <polygon points={TYMPANUM} fill="url(#gable-clapboard)" />
      <polygon points={TYMPANUM} fill="url(#gable-light)" />

      <g filter="url(#gable-soffit)">
        <polygon points={FASCIA.left} fill="#fffefa" />
        <polygon points={FASCIA.right} fill="#e8e9ee" />
        <polygon points={ROOF.left} fill="#3b2c31" />
        <polygon points={ROOF.right} fill="#2a2025" />
        <polygon points={RAKE.left} fill="#fbfaf6" />
        <polygon points={RAKE.right} fill="#e1e2e8" />
      </g>
      <polyline points={rakeLine(0.8)} fill="none" stroke="#ffffff" strokeWidth="1.5" />
      <polyline points={rakeLine(BANDS.fascia - 0.7)} fill="none" stroke="#767b92" strokeWidth="1.3" opacity="0.6" />
      <polyline points={rakeLine(BANDS.roof + 0.7)} fill="none" stroke="#ffffff" strokeWidth="1.3" />
      <polyline points={rakeLine(BANDS.rake - 0.7)} fill="none" stroke="#767b92" strokeWidth="1.3" opacity="0.55" />
    </svg>
  );
}

/**
 * The header: Moriah's porch gable, drawn at the photo's pitch, standing in
 * front of the church's own trees — cut from their photograph and blurred
 * into dusk. The vent is the home link. On inner pages the page title sits in
 * the tympanum; on home the frieze inscription is the page's heading.
 */
export function Gable({ title }: { title?: string }) {
  const Inscription = title ? 'p' : 'h1';

  return (
    <header className={styles.gable}>
      <div className={styles.frame}>
        <div className={styles.pedimentBox} style={oculusBox}>
          <PedimentDrawing />
          <Link href={PORTICO_PATH} className={styles.oculusLink} aria-label={porticoLabels.home}>
            <Oculus idPrefix="gable" />
          </Link>
          {title ? <h1 className={styles.title}>{title}</h1> : null}
        </div>
        <Inscription className={styles.frieze}>
          <span className={styles.friezeFirst}>{lockup.first}</span>{' '}
          <span className={styles.friezeRest}>{lockup.rest}</span>
        </Inscription>
      </div>
    </header>
  );
}
