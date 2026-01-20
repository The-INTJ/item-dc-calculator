/**
 * Contest lifecycle states as defined in the Master Plan:
 * - debug: Admin-only testing mode (not used during live events)
 * - set: Guests arriving and choosing roles
 * - shake: Drinks being made, timer running, voting OPEN
 * - scored: Voting CLOSED, tallying scores
 */
export type ContestPhase = 'debug' | 'set' | 'shake' | 'scored';
export type JudgeRole = 'admin' | 'judge' | 'viewer';

export interface Judge {
  id: string;
  displayName: string;
  role: JudgeRole;
  contact?: string;
}

export interface Drink {
  id: string;
  name: string;
  slug: string;
  description: string;
  round: string;
  submittedBy: string;
  scoreByUser?: Record<string, ScoreBreakdown>;
  scoreTotals?: ScoreBreakdown;
  scoreLock?: {
    locked: boolean;
    expiresAt?: number;
    token?: string;
    updatedAt?: number;
  };
}

export interface ScoreBreakdown {
  aroma: number;
  balance: number;
  presentation: number;
  creativity: number;
  overall: number;
}

export interface VoteCategory {
  id: string;
  label: string;
  description?: string;
  sortOrder: number;
}

export interface ScoreEntry {
  id: string;
  drinkId: string;
  judgeId: string;
  breakdown: ScoreBreakdown;
  notes?: string;
}

export interface ContestRound {
  id: string;
  name: string;
  number?: number | null;
  /** Each round has its own state; the active round's state is the global state */
  state: ContestPhase;
}

export interface Contest {
  id: string;
  name: string;
  slug: string;
  phase: ContestPhase;
  location?: string;
  startTime?: string;
  bracketRound?: string;
  currentDrinkId?: string;
  defaultContest?: boolean;
  rounds?: ContestRound[];
  activeRoundId?: string | null;
  futureRoundId?: string | null;
  categories?: VoteCategory[];
  drinks: Drink[];
  judges: Judge[];
  scores: ScoreEntry[];
}

export interface MixologyData {
  contests: Contest[];
}
