'use client';

import { useState, useSyncExternalStore } from 'react';

import type { RuleSet } from '../engine';
import {
  DEFAULT_STYLE_ID,
  hasSetupParams,
  parseSetupParams,
  RuleSetSchema,
  setupParams,
  styleById,
  tweaksBetween,
  withRule,
  type GameSetup,
  type GameStyle,
} from '../variants';

/** The last setup used in this browser, as setup-link parameters. */
const REMEMBER_KEY = 'tracer:setup';

function readRemembered(): string | null {
  try {
    return window.localStorage.getItem(REMEMBER_KEY);
  } catch {
    return null;
  }
}

function remember(setup: GameSetup): void {
  try {
    window.localStorage.setItem(REMEMBER_KEY, setupParams(setup).toString());
  } catch {
    // Storage blocked: the setup just isn't remembered.
  }
}

const noSubscription = () => () => {};

function useRememberedQuery(): string | null {
  return useSyncExternalStore(noSubscription, readRemembered, () => null);
}

function styleOf(setup: GameSetup): GameStyle {
  return styleById(setup.styleId) ?? (styleById(DEFAULT_STYLE_ID) as GameStyle);
}

/**
 * The game being set up in the lobby: a style plus any rule tweaks — one
 * resolved RuleSet that both "Create game" and "Start local game" use.
 * A setup link (`setupQuery`) wins; otherwise the last setup used in this
 * browser; otherwise the default style.
 */
export function useGameSetup(setupQuery: string) {
  const linkParams = new URLSearchParams(setupQuery);
  const fromLink = hasSetupParams(linkParams);
  const remembered = useRememberedQuery();
  const [edited, setEdited] = useState<GameSetup | null>(null);
  const parsed = parseSetupParams(fromLink ? linkParams : new URLSearchParams(remembered ?? ''));
  const setup: GameSetup = edited ?? { styleId: parsed.styleId, rules: parsed.rules };
  const style = styleOf(setup);

  function update(next: GameSetup) {
    if (!RuleSetSchema.safeParse(next.rules).success) return;
    setEdited(next);
    remember(next);
  }

  return {
    setup,
    style,
    tweaks: tweaksBetween(style, setup.rules),
    /** Parts of a setup link that could not be used. */
    ignored: fromLink && edited === null ? parsed.ignored : [],
    pickStyle(styleId: string) {
      const picked = styleById(styleId);
      if (picked) update({ styleId: picked.id, rules: picked.rules });
    },
    setRule<K extends keyof RuleSet>(key: K, value: RuleSet[K]) {
      update({ ...setup, rules: withRule(setup.rules, key, value) });
    },
    resetRule(key: keyof RuleSet) {
      update({ ...setup, rules: withRule(setup.rules, key, style.rules[key]) });
    },
    resetAll() {
      update({ styleId: style.id, rules: style.rules });
    },
  };
}

export type GameSetupControls = ReturnType<typeof useGameSetup>;

/** A link that opens the lobby with this setup. */
export function setupUrl(setup: GameSetup): string {
  const query = setupParams(setup).toString();
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/tracer?${query}`;
}
