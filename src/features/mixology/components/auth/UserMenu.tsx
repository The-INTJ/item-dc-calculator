'use client';

/**
 * User menu - shows current user status and actions
 */

import { useAuth } from '../../contexts/AuthContext';

interface UserMenuProps {
  onLogin?: () => void;
  onRegister?: () => void;
}

export function UserMenu({ onLogin, onRegister }: UserMenuProps) {
  const { session, isAuthenticated, isGuest, logout, syncPendingData } = useAuth();

  if (!session) {
    return (
      <div className="user-menu user-menu--guest">
        <button type="button" onClick={onLogin} className="user-menu__action">
          Sign In
        </button>
        <button type="button" onClick={onRegister} className="user-menu__action">
          Create Account
        </button>
      </div>
    );
  }

  const hasPending = session.pendingSync && (
    (session.pendingSync.votes?.length ?? 0) > 0 ||
    session.pendingSync.profileUpdates
  );

  return (
    <div className="user-menu">
      <div className="user-menu__info">
        <span className="user-menu__name">{session.profile.displayName}</span>
        <span className="user-menu__status">
          {isAuthenticated ? '✓ Synced' : isGuest ? 'Guest' : 'Offline'}
        </span>
      </div>

      {isGuest && (
        <div className="user-menu__upgrade">
          <button type="button" onClick={onRegister} className="button-secondary">
            Create Account
          </button>
        </div>
      )}

      {hasPending && isAuthenticated && (
        <button
          type="button"
          onClick={() => syncPendingData()}
          className="user-menu__sync"
        >
          Sync pending data
        </button>
      )}

      {isAuthenticated && (
        <button type="button" onClick={logout} className="user-menu__logout">
          Sign Out
        </button>
      )}

      <div className="user-menu__stats">
        <span>{session.votes.length} votes</span>
        {session.pendingSync?.votes?.length ? (
          <span className="user-menu__pending">
            ({session.pendingSync.votes.length} pending sync)
          </span>
        ) : null}
      </div>
    </div>
  );
}
