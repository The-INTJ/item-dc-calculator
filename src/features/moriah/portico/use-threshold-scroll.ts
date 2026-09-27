'use client';

import { useEffect, useRef, type RefObject } from 'react';

import { createThresholdDriver, type ThresholdDriver } from './threshold-driver';

export interface ThresholdRefs {
  section: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  scene: RefObject<HTMLDivElement | null>;
  doorway: RefObject<HTMLElement | null>;
}

/**
 * Wires the entrance driver to the threshold's elements for as long as the
 * home page is mounted. Returns `enter`, for the door's own click. With
 * reduced motion requested the driver paints nothing and the CSS shows a
 * still, slightly open door with the words beneath it.
 */
export function useThresholdScroll({ section, stage, scene, doorway }: ThresholdRefs) {
  const driverRef = useRef<ThresholdDriver | null>(null);

  useEffect(() => {
    if (!section.current || !stage.current || !scene.current || !doorway.current) return undefined;
    const driver = createThresholdDriver({
      section: section.current,
      stage: stage.current,
      scene: scene.current,
      doorway: doorway.current,
    });
    driverRef.current = driver;
    return () => {
      driver.dispose();
      driverRef.current = null;
    };
  }, [section, stage, scene, doorway]);

  return () => driverRef.current?.enter();
}
