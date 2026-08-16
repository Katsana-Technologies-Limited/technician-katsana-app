# technician-katsana-app

React Native (Expo) mobile app for Katsana field technicians - the native
counterpart to [technician-katsana](../technician-katsana), the web version.
Talks to the same backend, [vts-backend-katsana](../vts-backend-katsana),
using the same `/api/technician/*` endpoints, authenticated via
`Authorization: Bearer <token>` instead of the web app's cookie (see
`src/lib/api.ts` and `src/context/AuthContext.tsx`).

## Getting started

```bash
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_URL - see the comment in that file
npm run android         # or: npm run ios / npm run web
```

## What's real vs. mocked

- **Auth** (login, session check, logout) is wired to the real backend.
- **Assignments, installation flow, inventory, history** mirror
  technician-katsana's current state and are still backed by mock data
  (`src/lib/mockData.ts`) - the backend doesn't have those endpoints yet.
  Swap `src/lib/mockData.ts` for real `api` calls once they exist; the
  screens are already structured around that data shape so it should be a
  fairly mechanical swap.

## Structure

```
src/
  components/   shared UI (Button, Card, Badge, SelectField, SignaturePad, ...)
  context/      AuthContext - token storage + technician session state
  lib/          api client, SecureStore token helpers, mock data
  navigation/   RootNavigator (auth gate) + AppTabs (bottom tabs)
  screens/      one file per screen
  theme/        brand color tokens (mirrors technician-katsana's palette)
```
