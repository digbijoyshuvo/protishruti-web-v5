import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Server-side check whether an email is already registered.
 * Uses the admin client (service role) to look up auth.users.
 * Always normalizes email to lowercase + trimmed before checking.
 */
export const checkEmailExists = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().trim().toLowerCase().email().max(255) }).parse(input)
  )
  .handler(async ({ data }) => {
    // Paginate through all auth users so the check is reliable beyond the
    // first page. Stops early on first match.
    const perPage = 1000;
    let page = 1;
    while (true) {
      const { data: result, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw new Error(error.message);
      const users = result?.users ?? [];
      if (users.some((u) => (u.email ?? "").toLowerCase() === data.email)) {
        return { exists: true };
      }
      if (users.length < perPage) return { exists: false };
      page += 1;
      if (page > 50) return { exists: false }; // safety cap (~50k users)
    }
  });
