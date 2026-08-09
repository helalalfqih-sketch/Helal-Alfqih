export interface ShareableProduct {
  name: string;
  slug: string;
}

export interface ShareUrls {
  productUrl: string;
  whatsapp: string;
  facebook: string;
  twitter: string;
  telegram: string;
}

export function buildShareUrls(
  product: ShareableProduct,
  origin = import.meta.env.VITE_PUBLIC_URL || "https://indexes-store.vercel.app",
): ShareUrls {
  const productUrl = decodeURI(new URL(`/product/${product.slug}`, origin).toString());
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedName = encodeURIComponent(product.name);
  const encodedMessage = encodeURIComponent(`${product.name}\n${productUrl}`);

  return {
    productUrl,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedMessage}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedName}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedName}`,
  };
}
