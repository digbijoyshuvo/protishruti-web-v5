import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  nidDataUrl: z.string().startsWith("data:image/"),
  selfieDataUrl: z.string().startsWith("data:image/"),
  nidPath: z.string().min(1).max(512),
  selfiePath: z.string().min(1).max(512),
});

const ResultSchema = z.object({
  same_person: z.boolean(),
  match_score: z.number().min(0).max(1),
  nid_has_face: z.boolean(),
  selfie_has_face: z.boolean(),
  spoof_suspected: z.boolean().default(false),
  reason: z.string().max(500),
});


export const verifyIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");

    // Lock: refuse if already processing OR verified
    const { data: existing } = await supabase
      .from("identity_verifications")
      .select("status, attempts")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.status === "verified") {
      return { status: "verified" as const, match_score: 1, reason: "Already verified" };
    }
    if (existing?.status === "processing") {
      throw new Error("Verification already in progress");
    }

    // Mark processing
    await supabase
      .from("identity_verifications")
      .upsert(
        {
          user_id: userId,
          status: "processing",
          nid_path: data.nidPath,
          selfie_path: data.selfiePath,
          attempts: (existing?.attempts ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
          reason: null,
          match_score: null,
        },
        { onConflict: "user_id" },
      );

    try {
      const body = {
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a biometric face-matching engine emulating a face-embedding recognition pipeline (FaceNet/ArcFace style). Two images are provided: (1) a national ID card, (2) a live selfie.\n\n" +
              "STEP 1 — Preprocessing (mentally): locate and crop the face region in each image, align by eyes, normalize for lighting and pose. If a face is not clearly present in either, set nid_has_face/selfie_has_face=false.\n\n" +
              "STEP 2 — Compare ONLY stable biometric landmarks that do not change with grooming, aging, or environment:\n" +
              "  • Inter-ocular distance and eye shape/spacing\n" +
              "  • Nose bridge width, length, nostril shape\n" +
              "  • Face/skull shape and proportions\n" +
              "  • Jawline and chin contour\n" +
              "  • Cheekbone structure\n" +
              "  • Eyebrow ridge position (not the hair of the brow)\n" +
              "  • Ear shape and position (if visible)\n" +
              "  • Relative distances between facial landmarks (eyes↔nose↔mouth↔chin)\n\n" +
              "STEP 3 — IGNORE these unstable / changeable attributes. Do NOT let them lower or raise the score:\n" +
              "  • Beard, mustache, stubble (presence or absence)\n" +
              "  • Hair style, length, color, hairline\n" +
              "  • Makeup, skin tone shifts from lighting/white balance\n" +
              "  • Glasses, accessories, headwear\n" +
              "  • Camera quality, resolution, compression, JPEG artifacts\n" +
              "  • Lighting direction, shadows, exposure\n" +
              "  • Minor aging (a few years), weight change, expression\n" +
              "  • Slight pose/angle differences\n" +
              "  • NID print quality, scan noise, or color cast\n\n" +
              "STEP 4 — Output a similarity confidence (match_score, 0..1) reflecting how likely the bone-structure and landmark geometry belong to the SAME person. Calibration:\n" +
              "  • >= 0.60 → same person (set same_person=true)\n" +
              "  • 0.45–0.60 → uncertain, borderline\n" +
              "  • < 0.45 → different person\n\n" +
              "STEP 5 — Anti-spoof: set spoof_suspected=true if the selfie looks like a photo-of-a-photo, screenshot, printed image, or screen recapture (moiré, screen bezel, paper edges, unnatural flatness, no skin texture). A genuine live selfie should show natural skin micro-texture and 3D lighting.\n\n" +
              "Return your answer via the submit_verification tool. Keep reason under 200 chars and mention which stable features drove the decision.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Image 1: National ID card (reference face)." },
              { type: "image_url", image_url: { url: data.nidDataUrl } },
              { type: "text", text: "Image 2: Live selfie (probe face)." },
              { type: "image_url", image_url: { url: data.selfieDataUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_verification",
              description: "Submit the biometric face-match verification result.",
              parameters: {
                type: "object",
                properties: {
                  same_person: { type: "boolean", description: "True if same person based on stable biometric features (score >= 0.60)" },
                  match_score: { type: "number", description: "0..1 biometric similarity confidence based on stable landmarks only" },
                  nid_has_face: { type: "boolean" },
                  selfie_has_face: { type: "boolean" },
                  spoof_suspected: { type: "boolean", description: "True if selfie appears to be a photo-of-photo, screenshot, or printed image" },
                  reason: { type: "string", description: "Short explanation citing stable features (max 200 chars)" },
                },
                required: ["same_person", "match_score", "nid_has_face", "selfie_has_face", "spoof_suspected", "reason"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_verification" } },
      };

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 429) throw new Error("Rate limit reached, please try again shortly.");
        if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
        throw new Error(`AI verification failed (${res.status})`);
      }

      const json = await res.json();
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) throw new Error("AI returned no result");
      const parsed = ResultSchema.parse(JSON.parse(args));

      // Decision logic
      let outcome: "verified" | "manual_review" | "failed";
      let reason: string;

      if (!parsed.nid_has_face) {
        outcome = "failed";
        reason = "No clear face detected in NID card image. Please upload a sharper photo.";
      } else if (!parsed.selfie_has_face) {
        outcome = "failed";
        reason = "No clear face detected in selfie. Please retake in good lighting.";
      } else if (parsed.spoof_suspected) {
        outcome = "failed";
        reason = "Selfie appears to be a photo of a photo or screen capture. Please take a live selfie.";
      } else if (parsed.match_score >= 0.6) {
        outcome = "verified";
        reason = parsed.reason;
      } else if (parsed.match_score >= 0.45) {
        outcome = "manual_review";
        reason = `Uncertain match (${Math.round(parsed.match_score * 100)}%) — flagged for manual review. ${parsed.reason}`;
      } else {
        outcome = "failed";
        reason = parsed.reason || "Biometric features do not match with sufficient confidence.";
      }

      await supabase
        .from("identity_verifications")
        .update({
          status: outcome,
          match_score: parsed.match_score,
          reason,
          verified_at: outcome === "verified" ? new Date().toISOString() : null,
        })
        .eq("user_id", userId);

      return {
        status: outcome,
        match_score: parsed.match_score,
        reason,
      };
    } catch (err: any) {
      await supabase
        .from("identity_verifications")
        .update({
          status: "failed",
          reason: err?.message?.slice(0, 500) ?? "Verification error",
        })
        .eq("user_id", userId);
      throw err;
    }
  });

