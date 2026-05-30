## Goal

Ensure logged-in users stay logged in across refreshes, tab navigation, and app restarts — and only get logged out when they click "Log out". Reduce noisy auth checks and avoid clearing valid sessions.

## Current state

`src/integrations/supabase/client.ts` already configures `persistSession: true`, `autoRefreshToken: true`, and `localStorage` storage — so tokens persist by default.

The actual bug is in `src/lib/auth.tsx`: on every app load it calls `supabase.auth.getUser()` and, if it returns **any** error (including transient network failures, offline state, or a slow refresh), it calls `signOut()` and wipes the session. That's why users get kicked out on refresh / tab switch.

## Changes

### 1. `src/lib/auth.tsx` — fix stale-session logic
- Trust the locally persisted session on boot. Do **not** call `getUser()` just to validate it.
- Only sign the user out when Supabase itself emits a `SIGNED_OUT` event or an explicit `session === null` from `onAuthStateChange` after we previously had one — not on a transient `getUser()` error.
- Distinguish error types: only treat `session_not_found` / `invalid_refresh_token` / `refresh_token_not_found` (status 400/401 from the auth server) as "truly stale". Network errors → keep the session.
- Set `loading = false` immediately after `getSession()` resolves so the UI doesn't hang.
- Subscribe to `TOKEN_REFRESHED` to update state in place (no role refetch, no redirect).
- Skip refetching roles on `TOKEN_REFRESHED` and on tab-focus events — only fetch roles when `user.id` actually changes.

### 2. `signOut` flow
- `signOut()` keeps current behavior (Supabase clears tokens from localStorage automatically).
- Add `localStorage.removeItem("pending_role")` as a safety net so no stale signup intent leaks.
- Reset `roles`, `user`, `session` state explicitly after `signOut()` returns, so UI updates instantly without waiting for the listener.

### 3. No DB / RLS / route changes
Routing in `src/routes/app.tsx` already redirects only when `!loading && !user` — that stays.

## Technical notes

```ts
// auth.tsx — replace the getUser() validation block
const { data: { session } } = await supabase.auth.getSession();
setSession(session);
setUser(session?.user ?? null);
setLoading(false);
if (session?.user) loadRolesFor(session.user.id);
else setRolesLoading(false);

// In onAuthStateChange, only refetch roles when user id changes:
let lastUserId: string | null = null;
supabase.auth.onAuthStateChange((event, s) => {
  setSession(s);
  setUser(s?.user ?? null);
  if (s?.user && s.user.id !== lastUserId) {
    lastUserId = s.user.id;
    setTimeout(() => loadRolesFor(s.user.id), 0);
  } else if (!s?.user) {
    lastUserId = null;
    setRoles([]);
    setRolesLoading(false);
  }
});
```

Supabase's `autoRefreshToken` already handles silent refresh ~60s before expiry — no extra timers or polling needed.

## Out of scope
- DB schema, RLS, signup/login UI, route guards (already correct).
- Switching to cookie-based sessions (would require a server-side auth refactor — not needed for the reported bug).