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
 * aligns. Every value comes from the database — a rating row is only rendered
 * when a real rating and a real review count exist, and a discount badge only
 * when a real, valid old price exists.
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
      className="card-lift flex w-[130px] shrink-0 snap-start flex-col overflow-hidden rounded-[13px] border border-ink-line bg-[linear-gradient(145deg,rgba(15,21,43,0.96),rgba(5,8,22,0.98))] p-1.5 sm:w-[138px] md:w-[168px] h-[234px] md:h-[286px]"
    >
      {/* badge / favorite row — fixed height keeps every image aligned */}
      <div className="relative mb-1 flex h-[18px] items-start justify-between">
        {discount > 0 ? (
          <span className="rounded-md bg-neon px-1.5 py-0.5 text-[8.5px] font-bold text-white">
            خصم {discount}%
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          aria-label={fav ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
          onClick={handleToggleFav}
          className="press -mt-1 -mr-1 grid h-5 w-5 place-items-center rounded-full text-ink-text transition hover:text-neon-2"
        >
          <Heart className={`h-3 w-3 ${fav ? "fill-neon-2 text-neon-2" : ""}`} strokeWidth={1.7} />
        </button>
      </div>

      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block h-[96px] w-full shrink-0 overflow-hidden rounded-[11px] bg-[#0A1020] md:h-[122px]"
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
        className="mt-1.5 line-clamp-2 overflow-hidden text-center h-[27px] text-[10px] font-semibold leading-[13.5px] text-ink-text md:h-[31px] md:text-[11px] md:leading-[15.5px]"
      >
        {product.name}
      </Link>

      {/* Rating row keeps its slot even without real rating data, so every
          card in the rail shares the same price and button baselines. */}
      <div className="mt-1 flex h-3.5 items-center justify-center gap-1 text-[9px] text-ink-muted">
        {hasRating ? (
          <>
            <Star className="h-2 w-2 fill-neon-2 stroke-neon-2" />
            <span className="font-semibold text-ink-text">{product.rating}</span>
            <span>({product.reviews})</span>
          </>
        ) : null}
      </div>

      <div className="mt-0.5 flex items-baseline justify-center gap-1.5">
        <span className="text-[12px] font-bold text-neon-2">{riyal(product.price)}</span>
        {hasDiscount ? (
          <span className="text-[9px] text-ink-muted line-through">{riyal(product.oldPrice!)}</span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        className="press mt-auto flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-[11px] bg-linear-to-l from-neon to-neon-2 text-[10px] font-bold text-white shadow-[0_10px_24px_-14px_var(--neon)] transition hover:brightness-110 active:scale-[0.97]"
      >
        أضف للسلة
        <ShoppingCart className="h-3 w-3" strokeWidth={1.7} />
      </button>
    </div>
  );
}
