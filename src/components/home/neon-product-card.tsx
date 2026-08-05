import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/store-data";
import { FadeImage } from "@/components/motion/fade-image";
import { useFavorites } from "@/lib/use-favorites";
import { useCart } from "@/lib/cart-store";

const riyal = (v: number) => `${Math.round(v).toLocaleString("en-US")} ريال`;

/**
 * Standardized storefront card: fixed image area, fixed 2-line title area,
 * fixed price row and a bottom-pinned cart button so every card in a rail
 * aligns. Fully integrated with real cart & favorites stores.
 */
export function NeonProductCard({ product }: { product: Product }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const addItem = useCart((s) => s.add);

  const fav = isFavorite(product.id);
  const hasDiscount =
    typeof product.oldPrice === "number" && product.oldPrice > product.price && product.price > 0;
  const discount = hasDiscount
    ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)
    : 0;
  const hasRating = Number(product.rating) > 0 && Number(product.reviews) > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product as any);
    toast.success("تمت الإضافة إلى السلة 🛒");
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
    toast(fav ? "تمت الإزالة من المفضلة" : "تمت الإضافة إلى المفضلة ❤️");
  };

  return (
    <div
      data-product-id={product.id}
      className="card-lift flex w-[184px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-ink-line bg-[linear-gradient(145deg,rgba(15,21,43,0.96),rgba(5,8,22,0.98))] p-3 sm:w-[198px] md:w-[229px] h-[328px] md:h-[394px]"
    >
      {/* badge / favorite row — fixed height keeps every image aligned */}
      <div className="relative mb-1 flex h-7 items-start justify-between">
        {discount > 0 ? (
          <span className="rounded-lg bg-neon px-2 py-0.5 text-[10px] font-bold text-white">
            خصم {discount}%
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          aria-label={fav ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
          onClick={handleToggleFav}
          className="press -mt-1 -mr-1 grid h-8 w-8 place-items-center rounded-full text-ink-text transition hover:text-neon-2"
        >
          <Heart
            className={`h-[18px] w-[18px] ${fav ? "fill-neon-2 text-neon-2" : ""}`}
            strokeWidth={1.7}
          />
        </button>
      </div>

      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block h-[138px] w-full shrink-0 overflow-hidden rounded-xl bg-[#0A1020] md:h-[176px]"
      >
        <FadeImage
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain duration-500 will-change-transform hover:scale-105"
        />
      </Link>

      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="mt-2 line-clamp-2 overflow-hidden text-center h-[36px] text-[13px] font-bold leading-[18px] text-ink-text md:h-[44px] md:text-[14px] md:leading-[22px]"
      >
        {product.name}
      </Link>

      {/* Rating row */}
      <div className="mt-1 flex h-4 items-center justify-center gap-1 text-[11px] text-ink-muted">
        {hasRating ? (
          <>
            <Star className="h-3 w-3 fill-neon-2 stroke-neon-2" />
            <span className="font-semibold text-ink-text">{product.rating}</span>
            <span>({product.reviews})</span>
          </>
        ) : null}
      </div>

      <div className="mt-1 flex items-baseline justify-center gap-1.5">
        <span className="text-[17px] font-black text-neon-2">{riyal(product.price)}</span>
        {hasDiscount ? (
          <span className="text-[11px] text-ink-muted line-through">
            {riyal(product.oldPrice!)}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        className="press mt-auto flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-linear-to-l from-neon to-neon-2 text-[13px] font-bold text-white shadow-[0_10px_24px_-14px_var(--neon)] transition hover:brightness-110 active:scale-[0.97]"
      >
        أضف للسلة
        <ShoppingCart className="h-4 w-4" strokeWidth={1.7} />
      </button>
    </div>
  );
}
