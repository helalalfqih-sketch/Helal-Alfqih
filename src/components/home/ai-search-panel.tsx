import { useNavigate } from "@tanstack/react-router";
import { Bot, Sparkles } from "lucide-react";
import { useState } from "react";

const CHIPS = ["سماعات بلوتوث", "كاميرات مراقبة", "لوحات شمسية", "عطور أصلية"];

/**
 * AI smart-search panel. Real search behaviour: every submit and every chip
 * navigates to /search with the typed term — no canned results.
 */
export function AiSearchPanel({ height }: { height?: number }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const go = (value: string) => {
    const term = value.trim();
    if (!term) return;
    navigate({ to: "/search", search: { q: term } as never });
  };

  return (
    <section
      aria-label="البحث الذكي بالذكاء الاصطناعي"
      className="flex flex-col justify-between gap-2 rounded-[22px] border border-neon/45 bg-[linear-gradient(145deg,rgba(15,21,43,0.96),rgba(5,8,22,0.98))] p-3.5 shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_0_46px_-20px_var(--neon)]"
      style={{ height }}
    >
      <div>
        <h2 className="flex items-center justify-center gap-1.5 text-[17px] font-bold leading-[24px]">
          <Sparkles className="h-[17px] w-[17px] text-neon-2" strokeWidth={1.7} />
          <span>
            البحث الذكي <span className="text-neon-2">بالذكاء الاصطناعي</span>
          </span>
        </h2>
        <p className="truncate text-center text-[12px] leading-[16px] text-ink-muted">
          اكتب مواصفات ما تبحث عنه وسنعثر على أفضل النتائج
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="mx-auto flex w-full max-w-[720px] items-center gap-2"
      >
        <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border border-neon/60 bg-ink text-neon-2 shadow-[0_0_22px_-6px_var(--neon)]">
          <Bot className="h-[26px] w-[26px]" strokeWidth={1.7} />
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="البحث الذكي عن منتج"
          placeholder="ابحث عن منتج..."
          className="h-[52px] min-w-0 flex-1 rounded-full border border-ink-line bg-ink/50 px-4 text-[14px] text-ink-text outline-none placeholder:text-ink-muted focus:border-neon/60"
        />
        <button
          type="submit"
          className="press grid h-[52px] w-[80px] shrink-0 place-items-center rounded-full bg-linear-to-l from-neon to-neon-2 text-[14px] font-bold text-white transition hover:brightness-110"
        >
          بحث
        </button>
      </form>

      {/* Four suggestion pills, all visible at once as in the reference. */}
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-1 overflow-hidden">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => go(c)}
            className="press flex h-[32px] min-w-0 flex-1 items-center justify-center overflow-hidden whitespace-nowrap rounded-[16px] border border-ink-line bg-ink/60 px-1 text-[9.5px] font-semibold leading-none text-ink-text transition hover:border-neon/50"
          >
            {c}
          </button>
        ))}
      </div>
    </section>
  );
}
