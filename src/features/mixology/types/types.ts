export type ContestPhase = 'setup' | 'active' | 'judging' | 'closed';
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
