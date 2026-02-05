# Mixology App - Quick Start Guide

## TL;DR

This app lets judges rate drinks at mixology contests. Firebase handles login, Firestore stores data.

---

## How to Test Auth (Right Now)

### 1. Start the app
```bash
npm run dev
```

### 2. Go to the account page
Open: http://localhost:3000/mixology/account

### 3. Try these things:

| Action | What Should Happen |
|--------|-------------------|
| Click "Continue as Guest" | Session created, stored in localStorage |
| Click "Register" | Creates Firebase account + Firestore profile |
| Click "Login" | Signs in with Firebase Auth |
| Click "Logout" | Clears session |

### 4. Check Firebase Console
Go to: https://console.firebase.google.com/project/playground-69cbc

- **Authentication > Users**: See registered accounts
- **Firestore > mixology_users**: See user profiles
- **Firestore > mixology_votes**: See submitted votes

---

## File Map

```
src/mixology/
├── auth/                    # Session & auth logic
│   ├── types.ts             # What a session looks like
│   ├── storage.ts           # localStorage read/write
│   ├── provider.ts          # Auth interface (login, register, etc)
│   └── AuthContext.tsx      # React context, wires everything
│
├── firebase/                # Firebase stuff
│   ├── config.ts            # API keys (GITIGNORED!)
│   ├── firebaseAuthProvider.ts  # Implements auth with Firebase
│   └── firebaseBackendProvider.ts # Firestore for contests/drinks
│
├── backend/                 # Data layer
│   ├── types.ts             # Contest, Drink, Judge, Score types
│   ├── inMemoryProvider.ts  # Fake data for testing
│   └── index.ts             # Which backend to use
│
└── hooks/                   # React hooks for data fetching
    └── useBackend.ts
```

---

## How Auth Works

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   UI        │────▶│ AuthContext  │────▶│ Firebase     │
│ (React)     │     │ (React)      │     │ Auth         │
└─────────────┘     └──────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ localStorage │  ← session persists here
                    └──────────────┘
```

1. User clicks Login/Register
2. AuthContext calls Firebase Auth
3. On success, saves session to localStorage
4. User profile stored in Firestore (`mixology_users` collection)

---

## Guest session cookies

Guest onboarding uses a few cookies to keep continuity between visits:

| Cookie | Purpose |
|--------|---------|
| `mixology_guest_id` | Stores the active guest identifier for the current session. |
| `mixology_guest_index` | Tracks multiple guest IDs on the same device for quick switching. |

---

## Key Types

### LocalSession (what's in localStorage)
```typescript
{
  guestId: "abc123",           // Random ID for guests
  userId: "firebase-uid",      // Set after login
  profile: {
    displayName: "Bob",
    email: "bob@test.com",
    role: "viewer"             // viewer | judge | admin
  },
  votes: [...],                // Votes made in this session
  pendingSync: {...},          // Stuff waiting to upload
  lastSynced: 1234567890
}
```

### AuthState (what React components see)
```typescript
{
  isGuest: true/false,
  isAuthenticated: true/false,
  session: LocalSession,
  isLoading: true/false,
  error: "message" | null
}
```

---

## Firestore Collections

| Collection | Document ID | Fields |
|------------|-------------|--------|
| `mixology_users` | Firebase UID | displayName, email, role, createdAt |
| `mixology_votes` | Auto-generated | userId, contestId, drinkId, score, timestamp |

---

## Common Issues

### "Firebase not initialized"
- You're on the server (SSR). Firebase client SDK only works in browser.
- Check: Are you in a `'use client'` component?

### "User not appearing in Firestore"
- Registration creates both Auth user AND Firestore doc
- Check Firebase Console > Firestore > mixology_users

### "Votes not syncing"
- Guest votes stay in localStorage until account creation
- Check `pendingSync` in localStorage

### "Config file missing"
- `src/mixology/firebase/config.ts` is gitignored
- Create it with your Firebase credentials (see main README)

---

## Quick Debug

Open browser console, paste:
```javascript
// See current session
JSON.parse(localStorage.getItem('mixology_session'))

// Clear session (logout)
localStorage.removeItem('mixology_session')
```

---

## Pages

| URL | Purpose |
|-----|---------|
| `/mixology` | Main landing |
| `/mixology/account` | Test auth flows |
| `/mixology/admin` | See contests/drinks (fake data) |

---

## What's Real vs Fake

| Feature | Status |
|---------|--------|
| User auth (login/register) | ✅ Real (Firebase) |
| User profiles | ✅ Real (Firestore) |
| Contests/drinks data | ❌ Fake (in-memory) |
| Votes | 🟡 Local only (localStorage) |

---

## Next Steps

1. Test auth at `/mixology/account`
2. Check Firebase Console for users
3. Build voting UI
4. Wire votes to Firestore
