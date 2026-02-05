'use client';

/**
 * User menu - shows current user status and actions
 */

import { useAuth } from '../../contexts/auth/AuthContext';

interface UserMenuProps {
  onLogin?: () => void;
  onRegister?: () => void;
}

export function UserMenu({ onLogin, onRegister }: UserMenuProps) {
  const { session, isAuthenticated, isGuest, logout } = useAuth();

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

      {isAuthenticated && (
        <button type="button" onClick={logout} className="user-menu__logout">
          Sign Out
        </button>
      )}
    </div>
  );
}
