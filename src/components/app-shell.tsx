import { Link, useRouterState } from "@tanstack/react-router";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Bell,
  Home,
  Menu,
  MessageCircle,
  ScanLine,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart-store";
import { MainMenu } from "@/components/main-menu";
import { SiteFooter } from "@/components/site-footer";
import { whatsappLink } from "@/lib/whatsapp";
import { SCROLL_SPRING } from "@/components/motion/motion-tokens";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-ink text-ink-text">
      <TopBar />
      <main
        className="mx-auto w-full max-w-md lg:max-w-[1024px]"
        style={{ paddingBottom: "calc(110px + env(safe-area-inset-bottom))" }}
      >
        {children}
        <SiteFooter />
      </main>
      <BottomNav />
    </div>
  );
}

function useCartCount() {
  const [count, setCount] = useState(0);
  const items = useCart((s) => s.items);
  useEffect(() => {
    setCount(items.reduce((a, i) => a + i.qty, 0));
  }, [items]);
  return count;
}

function TopBar() {
  const count = useCartCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const smooth = useSpring(scrollY, SCROLL_SPRING);
  const bgAlpha = useTransform(smooth, [0, 80], [0.75, 0.96]);
  const background = useMotionTemplate`color-mix(in oklab, var(--ink) calc(${bgAlpha} * 100%), transparent)`;
  const borderAlpha = useTransform(smooth, [0, 80], [0, 1]);
  const borderColor = useMotionTemplate`color-mix(in oklab, var(--ink-line) calc(${borderAlpha} * 100%), transparent)`;

  return (
    <motion.header
      dir="ltr"
      style={{ background, borderColor }}
      className="sticky top-0 z-40 mx-auto grid h-16 w-full max-w-md grid-cols-[44px_44px_1fr_44px_44px] items-center gap-2 border-b px-3.5 pt-2 backdrop-blur lg:h-[72px] lg:grid-cols-[58px_58px_1fr_58px_58px] lg:gap-3.5"
    >
      <button
        type="button"
        aria-label="القائمة"
        onClick={() => setMenuOpen(true)}
        className="press grid h-11 w-11 place-items-center rounded-[14px] border border-ink-line bg-ink-card text-ink-text lg:h-[58px] lg:w-[58px]"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Link
        to="/search"
        search={{ q: "" }}
        aria-label="المسح الضوئي"
        className="press grid h-11 w-11 place-items-center rounded-[14px] border border-ink-line bg-ink-card text-ink-text lg:h-[58px] lg:w-[58px]"
      >
        <ScanLine className="h-5 w-5" />
      </Link>
      <Link
        to="/search"
        search={{ q: "" }}
        className="press flex h-[46px] min-w-0 items-center gap-2 rounded-[23px] border border-ink-line bg-ink-card px-3.5 text-[11.5px] text-ink-muted lg:h-[62px] lg:rounded-[31px] lg:text-[15px]"
      >
        <Search className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" />
        <span dir="rtl" className="min-w-0 flex-1 truncate text-right">
          ابحث عن منتج، قسم أو علامة تجارية...
        </span>
      </Link>
      <Link
        to="/account"
        aria-label="الحساب"
        className="press relative grid h-11 w-11 place-items-center text-ink-text lg:h-[58px] lg:w-[58px]"
      >
        <Bell className="h-[22px] w-[22px] lg:h-7 lg:w-7" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-neon" />
      </Link>
      <Link
        to="/cart"
        aria-label="السلة"
        className="press relative grid h-11 w-11 place-items-center text-ink-text lg:h-[58px] lg:w-[58px]"
      >
        <ShoppingCart className="h-[22px] w-[22px] lg:h-7 lg:w-7" />
        {count > 0 ? (
          <span className="absolute -right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-neon px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        ) : null}
      </Link>
      <MainMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </motion.header>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduced = useReducedMotion();
  const count = useCartCount();

  const tabs = [
    { to: "/cart", label: "السلة", icon: ShoppingCart, badge: count },
    { to: "/search", label: "بحث", icon: Search },
    { to: "/", label: "الرئيسية", icon: Home, center: true },
    { to: null, label: "واتساب", icon: MessageCircle, dot: true },
    { to: "/account", label: "حسابي", icon: User },
  ] as const;

  return (
    <nav
      className="fixed inset-x-3.5 z-40 mx-auto h-[72px] w-auto max-w-[362px] rounded-[36px] border border-ink-line bg-ink-card/95 backdrop-blur sm:max-w-[398px] lg:h-[86px] lg:max-w-[964px]"
      style={{ bottom: "calc(10px + env(safe-area-inset-bottom))" }}
    >
      <ul className="grid h-full grid-cols-5 items-center px-2">
        {tabs.map((t) => {
          const active = t.to !== null && pathname === t.to;
          const Icon = t.icon;
          const inner =
            "center" in t && t.center ? (
              <div className="flex flex-col items-center gap-1">
                <div className="grid h-16 w-16 -translate-y-5 place-items-center rounded-full bg-neon text-white shadow-[0_10px_25px_-6px_var(--neon)] lg:h-[76px] lg:w-[76px]">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="-mt-4 text-[10px] font-bold text-neon-2">{t.label}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? "text-neon-2" : "text-ink-muted"}`} />
                  {"badge" in t && t.badge ? (
                    <span className="absolute -end-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-neon px-1 text-[9px] font-bold text-white">
                      {t.badge}
                    </span>
                  ) : null}
                  {"dot" in t && t.dot ? (
                    <span className="absolute -end-1 -top-1 h-2 w-2 rounded-full bg-neon-2" />
                  ) : null}
                </div>
                <span
                  className={`text-[10px] font-semibold ${active ? "text-neon-2" : "text-ink-muted"}`}
                >
                  {t.label}
                </span>
              </div>
            );

          if (t.to === null) {
            return (
              <li key={t.label}>
                <a
                  href={whatsappLink("مرحباً، أريد الاستفسار عن منتج")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press flex flex-col items-center"
                >
                  {inner}
                </a>
              </li>
            );
          }
          return (
            <li key={t.label}>
              <Link
                to={t.to}
                className="press flex flex-col items-center"
                onClick={(e) => {
                  if (pathname !== t.to) return;
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
                }}
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
