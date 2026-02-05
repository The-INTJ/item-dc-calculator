/**
 * Auth state reducer for Mixology.
 */

import { useReducer } from 'react';
import type { AuthState, AuthAction } from './types';

const initialState: AuthState = { status: 'loading' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOADING':
      return { status: 'loading' };

    case 'AUTHENTICATED':
      return { status: 'authenticated', session: action.session };

    case 'GUEST':
      return { status: 'guest', session: action.session };

    case 'ERROR':
      return { status: 'error', message: action.message };

    case 'LOGOUT':
      return { status: 'unauthenticated' };

    case 'UPDATE_SESSION':
      if (state.status === 'authenticated') {
        return { status: 'authenticated', session: action.session };
      }
      if (state.status === 'guest') {
        return { status: 'guest', session: action.session };
      }
      return state;
  }
}

export function useAuthReducer() {
  return useReducer(authReducer, initialState);
}
