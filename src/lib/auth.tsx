import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "sme" | "investor" | "admin";

type Ctx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  rolesLoading: boolean;
  roles: Role[];
  signOut: () => Promise<void>;
  setActiveRole: (role: "sme" | "investor") => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  user: null,
  session: null,
  loading: true,
  rolesLoading: true,
  roles: [],
  signOut: async () => {},
  setActiveRole: async () => {},
});

async function fetchRoles(userId: string): Promise<Role[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as Role);
}

async function applyPendingRole(userId: string): Promise<Role[] | null> {
  let pending: string | null = null;
  try { pending = localStorage.getItem("pending_role"); } catch {}
  if (!pending || (pending !== "sme" && pending !== "investor")) return null;
  try { localStorage.removeItem("pending_role"); } catch {}
  const existing = await fetchRoles(userId);
  // Fresh signup with no roles → just insert the chosen role.
  if (existing.length === 0) {
    await supabase.from("user_roles").insert({ user_id: userId, role: pending });
    return [pending as Role];
  }
  // The DB trigger always seeds a default 'sme' role for new users. For
  // OAuth signups (Google) the chosen role can't be passed through user
  // metadata, so the seed wins unless we override it for very recent users.
  // Only override when (a) user was created in the last 2 minutes,
  // (b) they currently have exactly one role, and (c) the pending role
  // differs from the seeded one. This keeps returning users untouched.
  const { data: { user } } = await supabase.auth.getUser();
  const createdAt = user?.created_at ? new Date(user.created_at).getTime() : 0;
  const isFresh = createdAt && Date.now() - createdAt < 2 * 60 * 1000;
  if (isFresh && existing.length === 1 && existing[0] !== pending) {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: pending });
    return [pending as Role];
  }
  return existing;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    let lastUserId: string | null = null;

    const loadRolesFor = async (uid: string) => {
      setRolesLoading(true);
      const applied = await applyPendingRole(uid);
      const r = applied ?? (await fetchRoles(uid));
      setRoles(r);
      setRolesLoading(false);
    };

    // Listener: trust Supabase events. Only refetch roles when the user id
    // actually changes (skip TOKEN_REFRESHED noise). Never call signOut here.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      const newId = s?.user?.id ?? null;
      if (newId && newId !== lastUserId) {
        lastUserId = newId;
        setTimeout(() => { loadRolesFor(newId); }, 0);
      } else if (!newId) {
        lastUserId = null;
        setRoles([]);
        setRolesLoading(false);
      }
    });

    // Boot: trust the persisted session. Do NOT validate with getUser() —
    // a transient network error would wipe a perfectly good session.
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        lastUserId = s.user.id;
        await loadRolesFor(s.user.id);
      } else {
        setRolesLoading(false);
      }
    })();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try { localStorage.removeItem("pending_role"); } catch {}
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRoles([]);
    setRolesLoading(false);
  };

  const setActiveRole = async (role: "sme" | "investor") => {
    if (!user) return;
    await supabase.from("user_roles").delete().eq("user_id", user.id);
    await supabase.from("user_roles").insert({ user_id: user.id, role });
    setRoles([role]);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, rolesLoading, roles, signOut, setActiveRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
