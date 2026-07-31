import { ShoppingBag } from "lucide-react";
import { useAppearance } from "@/components/appearance-provider";
import noqtaLogo from "@/assets/noqta-logo.png";

type BrandSize = "sm" | "md" | "lg";

const SIZES: Record<
  BrandSize,
  { box: string; icon: string; name: string; tagline: string }
> = {
  sm: { box: "h-7 w-7 rounded-lg", icon: "h-3.5 w-3.5", name: "text-xs", tagline: "text-[9px]" },
  md: { box: "h-9 w-9 rounded-xl", icon: "h-4.5 w-4.5", name: "text-sm", tagline: "text-[11px]" },
  lg: { box: "h-12 w-12 rounded-2xl", icon: "h-6 w-6", name: "text-lg", tagline: "text-xs" },
};

export interface StoreBrandProps {
  size?: BrandSize;
  /** Hide the tagline line (name only). */
  nameOnly?: boolean;
  /** Extra classes for the name text (e.g. showcase palette on dark hero). */
  nameClassName?: string;
  /** Extra classes for the tagline text. */
  taglineClassName?: string;
}

export function StoreBrand({
  size = "md",
  nameOnly = false,
  nameClassName = "text-primary",
  taglineClassName = "text-muted-foreground",
}: StoreBrandProps) {
  const { settings } = useAppearance();
  const storeName = settings.brand_settings?.storeName || settings.navigation?.storeName || "اندكس ستور";
  const tagline = (settings.navigation as { tagline?: string })?.tagline || "";
  const logoUrl =
    settings.store_identity?.logoUrl ||
    (settings.navigation as { logoUrl?: string })?.logoUrl ||
    noqtaLogo;
  const s = SIZES[size];

  return (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={storeName}
          className={`${s.box} shrink-0 object-cover shadow-brand overflow-hidden`}
        />
      ) : (
        <div
          className={`grid ${s.box} shrink-0 place-items-center bg-primary text-primary-foreground shadow-brand`}
        >
          <ShoppingBag className={s.icon} />
        </div>
      )}
      <div className="min-w-0 leading-tight">
        <div className={`truncate font-black ${s.name} ${nameClassName}`}>{storeName}</div>
        {!nameOnly && tagline && (
          <div className={`truncate ${s.tagline} ${taglineClassName}`}>{tagline}</div>
        )}
      </div>
    </div>
  );
}
