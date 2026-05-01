'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedScoreProps {
  score: number | null;
  signature: string;
  className?: string;
}

function formatScore(score: number | null) {
  return score === null ? '-' : String(score);
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

export function AnimatedScore({
  score,
  signature,
  className = 'contest-display__score',
}: AnimatedScoreProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const [burst, setBurst] = useState<{ id: number; delta: number } | null>(null);
  const previous = useRef({ score, signature });
  const mounted = useRef(false);
  const burstId = useRef(0);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      previous.current = { score, signature };
      setDisplayScore(score);
      return undefined;
    }

    const before = previous.current;
    previous.current = { score, signature };

    if (before.signature === signature) return undefined;

    burstId.current += 1;

    if (before.score === null || score === null || before.score === score) {
      setDisplayScore(score);
      setBurst({ id: burstId.current, delta: 0 });
      const clearBurst = window.setTimeout(() => setBurst(null), 720);
      return () => window.clearTimeout(clearBurst);
    }

    const delta = score - before.score;
    const steps = Math.min(28, Math.max(8, Math.abs(delta) * 4));
    let frame = 0;
    setBurst({ id: burstId.current, delta });

    const tick = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(1, frame / steps);
      const eased = easeOutCubic(progress);
      setDisplayScore(Math.round(before.score! + delta * eased));

      if (progress === 1) {
        window.clearInterval(tick);
      }
    }, 32);
    const clearBurst = window.setTimeout(() => setBurst(null), 920);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(clearBurst);
    };
  }, [score, signature]);

  const classes = [
    className,
    'animated-score',
    burst ? 'animated-score--bursting' : '',
    burst && burst.delta > 0 ? 'animated-score--up' : '',
    burst && burst.delta < 0 ? 'animated-score--down' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} data-score-signature={signature}>
      <span className="animated-score__value">{formatScore(displayScore)}</span>
      {burst ? (
        <span className="animated-score__burst" key={burst.id} aria-hidden="true">
          {burst.delta > 0 ? `+${burst.delta}` : burst.delta < 0 ? String(burst.delta) : 'pop'}
        </span>
      ) : null}
    </span>
  );
}
