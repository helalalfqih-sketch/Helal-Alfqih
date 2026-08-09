import { Currency } from '../types';

export function formatPrice(priceYER: number, currency: Currency = 'YER'): string {
  if (currency === 'SAR') {
    // Approx 1 SAR ≈ 140 YER
    const priceSAR = Math.round(priceYER / 140);
    return `${priceSAR.toLocaleString('ar-YE')} ريال سعودي`;
  } else if (currency === 'USD') {
    // Approx 1 USD ≈ 530 YER
    const priceUSD = (priceYER / 530).toFixed(1);
    return `$${priceUSD}`;
  }
  
  // Default YER
  return `${priceYER.toLocaleString('ar-YE')} ريال`;
}
