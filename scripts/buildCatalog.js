const fs = require('fs');
const path = require('path');

// Read raw JSON data if created or inline
const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, 'rawCatalog.json'), 'utf8'));

function parsePriceToYER(priceStr, currency) {
  if (!priceStr) return 10000;
  // Convert Arabic numerals to Western
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  let westernStr = priceStr;
  for (let i = 0; i < 10; i++) {
    westernStr = westernStr.replaceAll(arabicDigits[i], String(i));
  }
  // Remove spaces, currency symbols, commas, non-numeric except dot
  // e.g. "ر.ي. 18,000.00" -> "18000.00"
  let cleanNum = westernStr.replace(/[^0-9.]/g, '');
  let val = parseFloat(cleanNum) || 10000;
  if (val < 10) val = val * 1000; // safety fallback

  if (currency === 'SAR') {
    return Math.round(val * 140);
  } else if (currency === 'USD') {
    return Math.round(val * 530);
  }
  return Math.round(val);
}

function cleanTitle(name) {
  if (!name) return '';
  // Remove leading/trailing emojis or weird characters if needed, but keep Arabic intact
  return name.trim();
}

function determineCategory(name, desc) {
  const text = (name + ' ' + desc).toLowerCase();
  
  if (text.includes('دريل') || text.includes('منشار') || text.includes('قصاصة') || text.includes('لحام') || text.includes('مفك') || text.includes('مكبس') || text.includes('أدوات') || text.includes('صاروخ') || text.includes('قاطع') || text.includes('جلخ') || text.includes('راوتر') || text.includes('حفر') || text.includes('عازل') || text.includes('معجون')) {
    return 'tools';
  }
  if (text.includes('سيار') || text.includes('إطار') || text.includes('شاحن سيارة') || text.includes('داش كام') || text.includes('رافعة') || text.includes('كفر') || text.includes('زجاج السيارة') || text.includes('طوارئ') || text.includes('اشترك') || text.includes('اشتراك') || text.includes('باور بنك') || text.includes('غماز')) {
    return 'automotive';
  }
  if (text.includes('طفل') || text.includes('أطفال') || text.includes('هزاز') || text.includes('ناموسية') || text.includes('درون أطفال') || text.includes('مسبح أطفال') || text.includes('مقاعد أطفال') || text.includes('زحليقة') || text.includes('مرجيحة')) {
    return 'baby_kids';
  }
  if (text.includes('تدليك') || text.includes('مساج') || text.includes('رياضي') || text.includes('عقلة') || text.includes('ركبة') || text.includes('ظهر') || text.includes('مشد') || text.includes('ساونا') || text.includes('أسنان') || text.includes('حلاقة') || text.includes('شعر') || text.includes('بشرة') || text.includes('تجميل') || text.includes('غواشا') || text.includes('خدود') || text.includes('تزلج') || text.includes('سبيننج') || text.includes('أثقال') || text.includes('تمارين') || text.includes('قبضة')) {
    return 'health_fitness';
  }
  if (text.includes('مطبخ') || text.includes('خلاط') || text.includes('ثلج') || text.includes('مكواة') || text.includes('مكنسة') || text.includes('بروجكتر') || text.includes('مروحة') || text.includes('ثريا') || text.includes('حوض') || text.includes('غزل البنات') || text.includes('فشار') || text.includes('طابعة') || text.includes('دولاب') || text.includes('منشر') || text.includes('مطبخ') || text.includes('قعدة') || text.includes('أريكة') || text.includes('سرير') || text.includes('خيمة') || text.includes('موقد') || text.includes('ستارة')) {
    return 'home_appliances';
  }
  return 'accessories';
}

const products = rawData.data.map((item, idx) => {
  const priceYER = parsePriceToYER(item.price, item.currency);
  const originalPriceYER = Math.round(priceYER * (1.15 + (idx % 3) * 0.05));
  const discountPercent = Math.round(((originalPriceYER - priceYER) / originalPriceYER) * 100);

  // Images
  const mainImage = item.image_cdn_urls?.find(x => x.key === 'full')?.value || item.image_cdn_urls?.[0]?.value || '';
  
  const gallery = [];
  if (mainImage) gallery.push(mainImage);

  if (Array.isArray(item.additional_image_cdn_urls)) {
    item.additional_image_cdn_urls.forEach(group => {
      if (Array.isArray(group)) {
        const fullImg = group.find(x => x.key === 'full')?.value || group[0]?.value;
        if (fullImg && !gallery.includes(fullImg)) {
          gallery.push(fullImg);
        }
      }
    });
  }

  const secondaryImage = gallery[1] || mainImage;
  const videoUrl = item.videos?.[0]?.url || undefined;
  const category = determineCategory(item.name, item.description);

  return {
    id: `catalog-${item.id}`,
    name: cleanTitle(item.name),
    subtitle: item.description ? item.description.slice(0, 60).replace(/\n/g, ' ') + '...' : 'جودة عالية وضمان ممتاز',
    description: item.description || item.name,
    priceYER,
    originalPriceYER,
    discountBadge: `خصم ${discountPercent}%`,
    rating: Number((4.5 + (idx % 5) * 0.1).toFixed(1)),
    reviewsCount: 15 + ((idx * 7) % 85),
    image: mainImage,
    secondaryImage,
    gallery,
    videoUrl,
    category,
    inStock: item.availability === 'in stock',
    stockCount: item.availability === 'in stock' ? 5 + (idx % 12) : 0,
    isLowStock: idx % 7 === 0,
    isBestSeller: idx % 4 === 0,
    isBestOffer: idx % 3 === 0,
    isNewArrival: true,
    isFeatured: idx % 5 === 0
  };
});

fs.writeFileSync(path.join(__dirname, 'catalogProducts.json'), JSON.stringify(products, null, 2));
console.log(`Successfully generated ${products.length} products`);
