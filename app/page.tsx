'use client';

import Link from 'next/link';
import { useAuth } from '@/mixology/contexts/AuthContext';
import { useContestState, contestStateLabels } from '@/mixology/contexts/ContestStateContext';
import { AdminOnlyLink } from '@/components/ui';

function VotingStatusCard() {
  const { state } = useContestState();
  const { isAuthenticated, isGuest, session } = useAuth();

  const isLoggedIn = isAuthenticated || isGuest;
  const userName = session?.profile?.displayName;

  // Voting open during 'shake' phase
  if (state === 'shake') {
    return (
      <div className="landing-status-card landing-status-card--voting-open">
        <div className="landing-status-card__icon">🍹</div>
        <div className="landing-status-card__content">
          <h3>Voting is OPEN!</h3>
          <p>The contest is in <strong>Shake</strong> mode. Cast your votes now!</p>
          <Link href="/mixology/vote" className="button-primary landing-arrow-link">
            <span>Go vote now</span>
            <span className="landing-arrow">→</span>
          </Link>
        </div>
      </div>
    );
  }

  // Voting closed, scores being tallied
  if (state === 'scored') {
    return (
      <div className="landing-status-card landing-status-card--scored">
        <div className="landing-status-card__icon">📊</div>
        <div className="landing-status-card__content">
          <h3>Voting is Closed</h3>
          <p>Scores are being tallied. Check the bracket for results!</p>
          <Link href="/mixology/bracket" className="button-secondary landing-arrow-link">
            <span>View bracket</span>
            <span className="landing-arrow">→</span>
          </Link>
        </div>
      </div>
    );
  }

  // Pre-contest: set or debug
  return (
    <div className="landing-status-card landing-status-card--waiting">
      <div className="landing-status-card__icon">⏳</div>
      <div className="landing-status-card__content">
        <h3>Voting hasn&apos;t started yet</h3>
        <p>
          The contest is in <strong>{contestStateLabels[state]}</strong> mode.
          {isLoggedIn
            ? " You're all set — voting will open when the admin starts the Shake phase."
            : " Sign in now so you're ready when it opens!"}
        </p>
        {isLoggedIn ? (
          <Link href="/mixology/vote" className="button-secondary landing-arrow-link">
            <span>Preview the vote page</span>
            <span className="landing-arrow">→</span>
          </Link>
        ) : (
          <Link href="/mixology/onboard" className="button-primary landing-arrow-link">
            <span>Sign in to get ready</span>
            <span className="landing-arrow">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function AuthStatusCard() {
  const { isAuthenticated, isGuest, session, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="landing-auth-card landing-auth-card--loading">
        <p>Loading...</p>
      </div>
    );
  }

  const isLoggedIn = isAuthenticated || isGuest;
  const userName = session?.profile?.displayName || 'Guest';
  const isGuestUser = isGuest && !isAuthenticated;

  if (isLoggedIn) {
    return (
      <div className="landing-auth-card landing-auth-card--logged-in">
        <div className="landing-auth-card__greeting">
          <span className="landing-auth-card__icon">✓</span>
          <div>
            <h3>Welcome back, {userName}!</h3>
            <p className="landing-auth-card__status">
              {isGuestUser ? 'Signed in as guest' : 'Signed in'}
            </p>
          </div>
        </div>
        <div className="landing-auth-card__actions">
          <Link href="/mixology/account" className="landing-arrow-link landing-arrow-link--subtle">
            <span>Manage account</span>
            <span className="landing-arrow">→</span>
          </Link>
          {isGuestUser && (
            <Link href="/mixology/onboard" className="landing-arrow-link landing-arrow-link--subtle">
              <span>Upgrade to full account</span>
              <span className="landing-arrow">→</span>
            </Link>
          )}
          <button type="button" className="landing-logout-link" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-auth-card landing-auth-card--signed-out">
      <div className="landing-auth-card__greeting">
        <span className="landing-auth-card__icon">👋</span>
        <div>
          <h3>Not signed in</h3>
          <p className="landing-auth-card__status">Sign in to track your votes</p>
        </div>
      </div>
      <Link href="/mixology/onboard" className="button-primary landing-arrow-link">
        <span>Sign in or create account</span>
        <span className="landing-arrow">→</span>
      </Link>
    </div>
  );
}

function NavigationCards() {
  return (
    <section className="landing-nav-cards">
      <Link href="/mixology/vote" className="landing-nav-card">
        <div className="landing-nav-card__icon">🗳️</div>
        <div className="landing-nav-card__content">
          <h3>Vote</h3>
          <p>Rate drinks and submit your scores</p>
        </div>
        <span className="landing-arrow">→</span>
      </Link>

      <Link href="/mixology/bracket" className="landing-nav-card">
        <div className="landing-nav-card__icon">🏆</div>
        <div className="landing-nav-card__content">
          <h3>Bracket</h3>
          <p>View matchups and standings</p>
        </div>
        <span className="landing-arrow">→</span>
      </Link>

      <Link href="/mixology/account" className="landing-nav-card">
        <div className="landing-nav-card__icon">👤</div>
        <div className="landing-nav-card__content">
          <h3>Account</h3>
          <p>Manage your profile and votes</p>
        </div>
        <span className="landing-arrow">→</span>
      </Link>

      <AdminOnlyLink href="/mixology/admin" className="landing-nav-card landing-nav-card--admin">
        <div className="landing-nav-card__icon">⚙️</div>
        <div className="landing-nav-card__content">
          <h3>Admin</h3>
          <p>Contest setup and management</p>
        </div>
        <span className="landing-arrow">→</span>
      </AdminOnlyLink>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>Mixology Rating App</h1>
        <p className="landing-tagline">
          Contest voting for craft cocktail matchups
        </p>
      </header>

      <main className="landing-main">
        <div className="landing-status-section">
          <AuthStatusCard />
          <VotingStatusCard />
        </div>

        <NavigationCards />
      </main>
    </div>
  );
}
