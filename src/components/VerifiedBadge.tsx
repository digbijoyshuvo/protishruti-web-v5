import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({
  size = "sm",
  showLabel = false,
  className,
}: {
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  const dim = size === "xs" ? "h-3.5 w-3.5" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[#3D52A0]",
        showLabel && "rounded-full bg-[#3D52A0]/10 px-2 py-0.5 text-[10px] font-semibold",
        className,
      )}
      title="Identity verified"
      aria-label="Identity verified"
    >
      <BadgeCheck className={cn(dim, "fill-[#3D52A0] text-white")} strokeWidth={2.5} />
      {showLabel && <span>Verified</span>}
    </span>
  );
}
