import { ENTERED_PROGRESS, stageProgress, thresholdPhases } from './threshold-phases';

/**
 * The browser side of the home page's entrance: turns scroll position into
 * door angle, walk, light and words, written as CSS custom properties and a
 * single transform on the scene. No React here — the hook only wires it up.
 */

export interface ThresholdElements {
  section: HTMLElement;
  stage: HTMLElement;
  scene: HTMLElement;
  doorway: HTMLElement;
}

export interface ThresholdDriver {
  /** Glide the reader up the steps and through the doors. */
  enter: () => void;
  dispose: () => void;
}

/** How far the walk goes: far enough that the doorway overfills the view. */
const OVERSHOOT = 1.45;
const GLIDE_MS = 3400;

interface WalkGeometry {
  centerX: number;
  centerY: number;
  rise: number;
  scale: number;
}

/** Door-centred geometry, measured untransformed (offsets ignore transforms). */
function measure({ stage, doorway }: ThresholdElements): WalkGeometry {
  const centerX = doorway.offsetLeft + doorway.offsetWidth / 2;
  const centerY = doorway.offsetTop + doorway.offsetHeight / 2;
  const reach = Math.max(
    stage.clientWidth / doorway.offsetWidth,
    stage.clientHeight / doorway.offsetHeight,
  );
  return { centerX, centerY, rise: stage.clientHeight / 2 - centerY, scale: reach * OVERSHOOT };
}

function pinned({ section, stage }: ThresholdElements) {
  return {
    pinTop: parseFloat(getComputedStyle(stage).top) || 0,
    travel: section.offsetHeight - stage.offsetHeight,
  };
}

function paint(elements: ThresholdElements, walk: WalkGeometry, moving: boolean) {
  const { section, stage, scene } = elements;
  if (!moving) {
    stage.removeAttribute('data-live');
    for (const name of ['--open', '--flood', '--words']) stage.style.removeProperty(name);
    scene.style.transform = '';
    return;
  }
  const { pinTop, travel } = pinned(elements);
  const phase = thresholdPhases(stageProgress(section.getBoundingClientRect().top, pinTop, travel));

  stage.setAttribute('data-live', '');
  stage.style.setProperty('--open', phase.open.toFixed(4));
  stage.style.setProperty('--flood', phase.flood.toFixed(4));
  stage.style.setProperty('--words', phase.words.toFixed(4));
  scene.style.transformOrigin = `${walk.centerX}px ${walk.centerY}px`;
  scene.style.transform = `translate3d(0, ${(walk.rise * phase.zoom).toFixed(2)}px, 0) scale(${(walk.scale ** phase.zoom).toFixed(4)})`;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Scroll to `target` slowly enough to watch the doors open. Returns a cancel. */
function glide(target: number): () => void {
  const start = window.scrollY;
  const began = performance.now();
  let frame = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - began) / GLIDE_MS);
    window.scrollTo(0, start + (target - start) * easeInOut(t));
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

export function createThresholdDriver(elements: ThresholdElements): ThresholdDriver {
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
  let walk = measure(elements);
  let frame = 0;
  let stopGlide = () => {};

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      paint(elements, walk, motion.matches);
    });
  };
  const remeasure = () => {
    walk = measure(elements);
    schedule();
  };
  const interrupt = () => stopGlide();

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', remeasure);
  window.addEventListener('wheel', interrupt, { passive: true });
  window.addEventListener('touchstart', interrupt, { passive: true });
  motion.addEventListener('change', remeasure);
  paint(elements, walk, motion.matches);

  return {
    enter() {
      const { pinTop, travel } = pinned(elements);
      const target =
        window.scrollY + elements.section.getBoundingClientRect().top - pinTop + travel * ENTERED_PROGRESS;
      stopGlide();
      if (motion.matches) stopGlide = glide(target);
      else window.scrollTo(0, target);
    },
    dispose() {
      cancelAnimationFrame(frame);
      stopGlide();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      motion.removeEventListener('change', remeasure);
    },
  };
}
