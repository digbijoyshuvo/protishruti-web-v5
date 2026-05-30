import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ItemSchema = z.object({
  description: z.string(),
  quantity: z.number().nullable().optional(),
  unit_price: z.number().nullable().optional(),
  amount: z.number(),
  confidence: z.number().min(0).max(1).optional(),
});
const TxnSchema = z.object({
  date: z.string().optional(),
  total_amount: z.number(),
  type: z.enum(["sale", "expense", "return"]),
  payment_type: z.enum(["cash", "credit", "baki"]),
  counterparty: z.string().optional(),
  description: z.string().optional(),
  items: z.array(ItemSchema).default([]),
  confidence_scores: z.record(z.string(), z.number()).default({}),
});
const OcrResultSchema = z.object({
  raw_text: z.string(),
  language: z.enum(["bn", "en", "mixed"]).default("mixed"),
  transactions: z.array(TxnSchema),
});

export const ocrExtract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageDataUrl: string }) => {
    if (!input?.imageDataUrl?.startsWith("data:image/")) throw new Error("Invalid image");
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an OCR + parsing engine for handwritten Bangladeshi shop ledgers (khata) and cash memos in Bangla or English.
Read the page carefully. Then call the provided tool with:
- raw_text: verbatim transcription (preserve Bangla numerals if present, but convert numeric amounts to integer/decimal numbers in JSON).
- language: bn / en / mixed
- transactions: one record per ledger line. For each, provide total_amount (positive number), type (sale/expense/return), payment_type (cash/credit/baki — baki = unpaid credit), counterparty if visible, items array, and confidence_scores for fields you are less than 90% sure about (values 0-1).
Never invent amounts. If a number is illegible, set its confidence below 0.6 so the user reviews it.`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract transactions from this khata page." },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_extraction",
            description: "Submit the structured extraction.",
            parameters: {
              type: "object",
              properties: {
                raw_text: { type: "string" },
                language: { type: "string", enum: ["bn", "en", "mixed"] },
                transactions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string" },
                      total_amount: { type: "number" },
                      type: { type: "string", enum: ["sale", "expense", "return"] },
                      payment_type: { type: "string", enum: ["cash", "credit", "baki"] },
                      counterparty: { type: "string" },
                      description: { type: "string" },
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            description: { type: "string" },
                            quantity: { type: "number" },
                            unit_price: { type: "number" },
                            amount: { type: "number" },
                            confidence: { type: "number" },
                          },
                          required: ["description", "amount"],
                        },
                      },
                      confidence_scores: {
                        type: "object",
                        additionalProperties: { type: "number" },
                      },
                    },
                    required: ["total_amount", "type", "payment_type"],
                  },
                },
              },
              required: ["raw_text", "language", "transactions"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_extraction" } },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limited — please try again in a minute.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
      throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no structured result");
    let parsed;
    try { parsed = JSON.parse(args); } catch { throw new Error("AI returned invalid JSON"); }
    const valid = OcrResultSchema.safeParse(parsed);
    if (!valid.success) {
      // Best-effort fallback: return raw_text only
      return { raw_text: parsed.raw_text || "", language: "mixed" as const, transactions: [] };
    }
    return valid.data;
  });

export const aiSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { lang: "en" | "bn"; metrics: Record<string, number | string>; goal?: string }) => i)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { text: "" };
    const goal = data.goal ?? "summary";
    const langLabel = data.lang === "bn" ? "Bangla (বাংলা)" : "English";
    const prompt = `You are an analyst. Given these EXACT numbers (do not change them, do not invent new ones), write a brief ${goal} for a Bangladeshi SME owner in ${langLabel}. 2-4 short sentences. Reference figures verbatim.
Numbers: ${JSON.stringify(data.metrics)}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return { text: "" };
    const j = await res.json();
    return { text: j?.choices?.[0]?.message?.content ?? "" };
  });
