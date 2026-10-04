'use client';

import { useState } from 'react';

import { otherSide, type Side } from '../../engine';
import { BoardToolbar } from './PlayerBar';

/**
 * How the board is shown — which way it faces and whether threats are
 * marked — plus the toolbar that changes it. Shared by online and local games.
 */
export function useBoardDisplay(defaultOrientation: Side) {
  const [flipped, setFlipped] = useState(false);
  const [showThreats, setShowThreats] = useState(false);
  return {
    orientation: flipped ? otherSide(defaultOrientation) : defaultOrientation,
    showThreats,
    toolbar: (
      <BoardToolbar
        showThreats={showThreats}
        onToggleThreats={() => setShowThreats(!showThreats)}
        onFlip={() => setFlipped(!flipped)}
      />
    ),
  };
}
