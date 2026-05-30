import { BUSINESS_CATEGORIES } from "@/lib/categories";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";

export function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const { lang } = useI18n();
  const knownValues = BUSINESS_CATEGORIES.map((c) => c.value);
  const isCustom = value !== "" && !knownValues.includes(value);
  // Internal select state: "other" if custom, else the value
  const selectVal = isCustom ? "other" : value;

  return (
    <div className="space-y-2">
      <select
        className="w-full h-9 rounded-md border px-2 text-sm bg-background"
        value={selectVal}
        onChange={(e) => {
          if (e.target.value === "other") {
            // start with empty custom string
            onChange(isCustom ? value : " ");
          } else {
            onChange(e.target.value);
          }
        }}
      >
        <option value="">—</option>
        {BUSINESS_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {lang === "bn" ? c.bn : c.en}
          </option>
        ))}
      </select>
      {selectVal === "other" && (
        <Input
          autoFocus
          value={isCustom ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={lang === "bn" ? "আপনার ব্যবসার ধরন লিখুন" : "Describe your business type"}
        />
      )}
    </div>
  );
}
