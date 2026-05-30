import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type IdentityStatus = "unverified" | "processing" | "verified" | "failed" | "manual_review";

export type IdentityVerification = {
  status: IdentityStatus;
  match_score: number | null;
  reason: string | null;
  attempts: number;
  verified_at: string | null;
};

export function useIdentityVerification() {
  const { user } = useAuth();
  const [data, setData] = useState<IdentityVerification | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: row } = await supabase
      .from("identity_verifications")
      .select("status,match_score,reason,attempts,verified_at")
      .eq("user_id", user.id)
      .maybeSingle();
    setData(
      row
        ? (row as IdentityVerification)
        : { status: "unverified", match_score: null, reason: null, attempts: 0, verified_at: null },
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { verification: data, loading, refresh, verified: data?.status === "verified" };
}
