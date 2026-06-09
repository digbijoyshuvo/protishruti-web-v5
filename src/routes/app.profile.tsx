import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CategorySelect } from "@/components/CategorySelect";
import { ShopGate, useShop } from "@/components/ShopGate";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CoverImageUpload, LogoUpload } from "@/components/sme/ProfileImageUpload";
import { SMEProfileView } from "@/components/sme/SMEProfileView";
import { profileCompletion, type ShopProfile } from "@/lib/shopProfile";
import { Eye, Save, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/profile")({
  component: () => (
    <ShopGate>
      <ProfilePage />
    </ShopGate>
  ),
});

const RISK_OPTIONS: Array<ShopProfile["risk_level"]> = ["low", "medium", "high"];

function ProfilePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { shop } = useShop();
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [draft, setDraft] = useState<ShopProfile | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!shop) return;
    supabase
      .from("shops")
      .select("*")
      .eq("id", shop.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const p = normalize(data);
          setProfile(p);
          setDraft(p);
        }
      });
  }, [shop?.id]);

  const completion = useMemo(() => profileCompletion(draft), [draft]);

  if (!draft || !profile) {
    return <div className="p-6 text-sm text-muted-foreground">{t("loading_profile")}</div>;
  }

  const update = <K extends keyof ShopProfile>(k: K, v: ShopProfile[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error(t("biz_name_required"));
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("shops")
      .update({
        name: draft.name,
        address: draft.address,
        category: draft.category,
        contact_phone: draft.contact_phone,
        contact_email: draft.contact_email,
        logo_path: draft.logo_path,
        cover_path: draft.cover_path,
        description: draft.description,
        founded_year: draft.founded_year,
        website: draft.website,
        social_links: draft.social_links,
        funding_goal: draft.funding_goal,
        current_funding: draft.current_funding,
        roi_expectation: draft.roi_expectation,
        monthly_revenue: draft.monthly_revenue,
        team_size: draft.team_size,
        risk_level: draft.risk_level,
        tags: draft.tags,
        owner_display_name: draft.owner_display_name,
      })
      .eq("id", draft.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfile(draft);
    toast.success(t("profile_saved"));
  };

  if (preview) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold">{t("investor_preview")}</h2>
          <Button variant="outline" size="sm" onClick={() => setPreview(false)}>
            <X className="mr-2 h-4 w-4" /> {t("close_preview")}
          </Button>
        </div>
        <SMEProfileView shop={draft} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-semibold">{t("business_profile")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("biz_profile_sub")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPreview(true)}>
          <Eye className="mr-2 h-4 w-4" /> {t("investor_preview")}
        </Button>
      </div>

      {/* Completion */}
      <Card className="p-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-medium">{t("profile_completion")}</span>
          <span className="text-sm text-muted-foreground">{completion}%</span>
        </div>
        <Progress value={completion} className="h-2" />
        {completion < 100 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("completion_hint")}
          </p>
        )}
      </Card>

      {/* Cover + logo */}
      <Card className="p-4 space-y-4">
        <h3 className="font-medium text-sm">{t("brand_visuals")}</h3>
        <CoverImageUpload
          userId={user!.id}
          shopId={draft.id}
          kind="cover"
          currentPath={draft.cover_path}
          onUploaded={(p) => update("cover_path", p)}
          category={draft.category}
        />
        <LogoUpload
          userId={user!.id}
          shopId={draft.id}
          kind="logo"
          currentPath={draft.logo_path}
          onUploaded={(p) => update("logo_path", p)}
          category={draft.category}
        />
      </Card>

      {/* Identity */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium text-sm">{t("identity")}</h3>
        <Field label={t("business_name_lbl")}>
          <Input value={draft.name} onChange={(e) => update("name", e.target.value)} />
        </Field>
        <Field label={t("owner_name_lbl")}>
          <Input
            value={draft.owner_display_name ?? ""}
            onChange={(e) => update("owner_display_name", e.target.value)}
          />
        </Field>
        <Field label={t("category_lbl")}>
          <CategorySelect
            value={draft.category ?? ""}
            onChange={(v) => update("category", v)}
          />
        </Field>
        <Field label={t("description_lbl")}>
          <Textarea
            rows={4}
            value={draft.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
            placeholder={t("description_ph")}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("founded_year_lbl")}>
            <Input
              type="number"
              value={draft.founded_year ?? ""}
              onChange={(e) =>
                update("founded_year", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label={t("team_size_lbl")}>
            <Input
              type="number"
              value={draft.team_size ?? ""}
              onChange={(e) =>
                update("team_size", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
        </div>
      </Card>

      {/* Contact */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium text-sm">{t("contact_links")}</h3>
        <Field label={t("address_lbl")}>
          <Input
            value={draft.address ?? ""}
            onChange={(e) => update("address", e.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("phone_lbl")}>
            <Input
              value={draft.contact_phone ?? ""}
              onChange={(e) => update("contact_phone", e.target.value)}
            />
          </Field>
          <Field label={t("email_lbl")}>
            <Input
              type="email"
              value={draft.contact_email ?? ""}
              onChange={(e) => update("contact_email", e.target.value)}
            />
          </Field>
        </div>
        <Field label={t("website_lbl")}>
          <Input
            placeholder="https://"
            value={draft.website ?? ""}
            onChange={(e) => update("website", e.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("facebook_lbl")}>
            <Input
              placeholder="https://facebook.com/…"
              value={draft.social_links.facebook ?? ""}
              onChange={(e) =>
                update("social_links", { ...draft.social_links, facebook: e.target.value })
              }
            />
          </Field>
          <Field label={t("linkedin_lbl")}>
            <Input
              placeholder="https://linkedin.com/…"
              value={draft.social_links.linkedin ?? ""}
              onChange={(e) =>
                update("social_links", { ...draft.social_links, linkedin: e.target.value })
              }
            />
          </Field>
        </div>
      </Card>

      {/* Investment */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium text-sm">{t("investment")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("funding_goal_lbl")}>
            <Input
              type="number"
              value={draft.funding_goal ?? ""}
              onChange={(e) =>
                update("funding_goal", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label={t("current_funding_lbl")}>
            <Input
              type="number"
              value={draft.current_funding ?? 0}
              onChange={(e) => update("current_funding", Number(e.target.value || 0))}
            />
          </Field>
          <Field label={t("roi_expectation_lbl")}>
            <Input
              type="number"
              step="0.1"
              value={draft.roi_expectation ?? ""}
              onChange={(e) =>
                update("roi_expectation", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label={t("monthly_revenue_lbl")}>
            <Input
              type="number"
              value={draft.monthly_revenue ?? ""}
              onChange={(e) =>
                update("monthly_revenue", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
        </div>
        <Field label={t("risk_level_lbl")}>
          <div className="flex gap-2">
            {RISK_OPTIONS.map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={draft.risk_level === r ? "default" : "outline"}
                onClick={() => update("risk_level", r)}
              >
                {t(`risk_${r}`)}
              </Button>
            ))}
          </div>
        </Field>
        <Field label={t("tags_lbl")}>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {draft.tags.map((tg) => (
                <Badge key={tg} variant="secondary" className="gap-1">
                  {tg}
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "tags",
                        draft.tags.filter((x) => x !== tg),
                      )
                    }
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={t("add_tag_ph")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = tagInput.trim();
                    if (v && !draft.tags.includes(v)) update("tags", [...draft.tags, v]);
                    setTagInput("");
                  }
                }}
              />
            </div>
          </div>
        </Field>
      </Card>

      <div className="sticky bottom-2 z-10 flex justify-end gap-2 px-1">
        <Button variant="outline" onClick={() => setDraft(profile)} disabled={saving}>
          {t("reset_btn")}
        </Button>
        <Button onClick={save} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? t("saving") : t("save_profile_btn")}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function normalize(row: any): ShopProfile {
  return {
    ...row,
    social_links: (row.social_links ?? {}) as Record<string, string>,
    tags: (row.tags ?? []) as string[],
    current_funding: Number(row.current_funding ?? 0),
  };
}
