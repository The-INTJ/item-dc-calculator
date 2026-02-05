'use client';

/**
 * Auth modal - handles login, register, and guest flows
 */

import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { GuestPrompt } from './GuestPrompt';

type AuthView = 'guest' | 'login' | 'register';

interface AuthModalProps {
  initialView?: AuthView;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ initialView = 'guest', onClose, onSuccess }: AuthModalProps) {
  const [view, setView] = useState<AuthView>(initialView);

  const handleSuccess = () => {
    onSuccess?.();
    onClose?.();
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button type="button" className="auth-modal__close" onClick={onClose}>
            ×
          </button>
        )}

        {view === 'guest' && (
          <GuestPrompt
            onContinue={handleSuccess}
            onSwitchToLogin={() => setView('login')}
            onSwitchToRegister={() => setView('register')}
          />
        )}

        {view === 'login' && (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setView('register')}
          />
        )}

        {view === 'register' && (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </div>
    </div>
  );
}
