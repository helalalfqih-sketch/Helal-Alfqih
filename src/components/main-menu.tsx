import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchCategories } from "@/lib/actions/category.actions";
import type { LegacyCategoryShape } from "@/lib/data-adapter";
import { whatsappLink } from "@/lib/whatsapp";

const pages = [
  { to: "/", label: "الرئيسية", icon: Icons.Home },
  { to: "/offers", label: "العروض", icon: Icons.Tag },
  { to: "/search", label: "بحث", icon: Icons.Search },
  { to: "/cart", label: "سلة التسوق", icon: Icons.ShoppingCart },
  { to: "/track", label: "تتبع الطلب", icon: Icons.Truck },
  { to: "/account", label: "حسابي", icon: Icons.User },
] as const;

export function MainMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [categories, setCategories] = useState<LegacyCategoryShape[]>([]);

  useEffect(() => {
    if (!open || categories.length) return;
    let alive = true;
    fetchCategories()
      .then((rows) => {
        if (alive) setCategories(rows);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [open, categories.length]);

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        dir="rtl"
        className="w-[86%] max-w-xs overflow-y-auto border-ink-line bg-ink text-ink-text"
      >
        <SheetHeader className="text-right">
          <SheetTitle className="text-ink-text">اندكس ستور</SheetTitle>
        </SheetHeader>

        <nav className="mt-4 flex flex-col gap-1">
          {pages.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              onClick={close}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold text-ink-text transition hover:bg-ink-card"
            >
              <p.icon className="h-4.5 w-4.5 text-neon-2" />
              {p.label}
            </Link>
          ))}
        </nav>

        <p className="mt-5 px-3 text-[11px] font-bold text-ink-muted">الأقسام</p>
        <nav className="mt-2 flex flex-col gap-1">
          {categories.map((c) => {
            const Icon =
              (Icons as unknown as Record<string, Icons.LucideIcon>)[c.icon] ?? Icons.Package;
            return (
              <Link
                key={c.id}
                to="/category/$id"
                params={{ id: c.id }}
                onClick={close}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] text-ink-text transition hover:bg-ink-card"
              >
                <Icon className="h-4.5 w-4.5 text-neon-2" />
                {c.name}
              </Link>
            );
          })}
        </nav>

        <a
          href={whatsappLink("مرحباً، أريد الاستفسار عن منتج")}
          target="_blank"
          rel="noopener noreferrer"
          onClick={close}
          className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-neon py-3 text-[13px] font-bold text-white"
        >
          <Icons.MessageCircle className="h-4 w-4" />
          تواصل عبر واتساب
        </a>
      </SheetContent>
    </Sheet>
  );
}
