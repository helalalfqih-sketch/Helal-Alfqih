export const NEUTRAL_SVG_FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#140E24"/><rect x="150" y="150" width="100" height="80" rx="8" fill="none" stroke="#4b5563" stroke-width="3"/><circle cx="200" cy="190" r="18" fill="none" stroke="#4b5563" stroke-width="3"/><text x="50%" y="72%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="14">لا تتوفر صورة للمنتج</text></svg>'
)}`;

export function getSmartProductImage(
  _productName?: string,
  _category?: string,
  currentImage?: string
): string {
  // Only return real images from Supabase
  if (
    currentImage &&
    typeof currentImage === 'string' &&
    currentImage.trim().length > 5 &&
    !currentImage.includes('data:image/svg') &&
    (currentImage.startsWith('http://') || currentImage.startsWith('https://') || currentImage.startsWith('/'))
  ) {
    return currentImage.trim();
  }

  // Otherwise return neutral placeholder (No Unsplash / demo images allowed)
  return NEUTRAL_SVG_FALLBACK;
}
