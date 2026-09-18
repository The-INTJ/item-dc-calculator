'use client';

import { useEffect, useState } from 'react';

import { fetchGrassTips } from '../lib/grassApi';
import { GRASS_TIP_CARDS } from '../lib/tips';
import type { TipCard } from '../lib/types';

export function useGrassTips() {
  const [tips, setTips] = useState<TipCard[]>(GRASS_TIP_CARDS);
  const [tipsLoading, setTipsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchGrassTips()
      .then((cards) => { if (active && cards.length > 0) setTips(cards); })
      .catch(() => undefined)
      .finally(() => { if (active) setTipsLoading(false); });
    return () => { active = false; };
  }, []);

  return { tips, tipsLoading };
}
