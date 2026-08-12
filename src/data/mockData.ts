import { Product, Category, OrderStatus, NotificationItem } from '../types';

export const STORE_INFO = {
  name: 'INDEXES STORE | متجر إندكس',
  tagline: 'PREMIUM QUALITY',
  phone: '967771370740',
  whatsappNumber: '967771370740',
  formattedPhone: '+967 771 370 740',
  address: 'صنعاء - شارع بيون - مقابل صيدلية الرعاية الصحية',
  governorates: [
    'أمانة العاصمة (صنعاء)',
    'محافظة صنعاء',
    'عدن',
    'تعز',
    'إب',
    'الحديدة',
    'حضرموت (المكلا/سيئون)',
    'ذمار',
    'عمران',
    'حجة',
    'صعدة',
    'البيضاء',
    'شبوة',
    'المهرة',
    'مأرب',
    'لحج',
    'أبين'
  ],
  freeShippingThresholdYER: 30000,
  freeShippingThresholdSAR: 215,
};

export const MODERN_ELECTRONICS: Product[] = [];

export const PRODUCTS: Product[] = [];

const getCategoryCount = (catId: string) => {
  if (catId === 'all') return PRODUCTS.length;
  return PRODUCTS.filter(p => p.category === catId).length;
};

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'الكل', icon: 'grid_view', count: PRODUCTS.length },
  { id: 'tools', name: 'أدوات ومعدات', icon: 'build', count: getCategoryCount('tools') },
  { id: 'automotive', name: 'مستلزمات السيارات', icon: 'directions_car', count: getCategoryCount('automotive') },
  { id: 'health_fitness', name: 'الصحة واللياقة', icon: 'fitness_center', count: getCategoryCount('health_fitness') },
  { id: 'home_appliances', name: 'أجهزة ومنزل', icon: 'kitchen', count: getCategoryCount('home_appliances') },
  { id: 'baby_kids', name: 'مستلزمات الأطفال', icon: 'child_care', count: getCategoryCount('baby_kids') },
  { id: 'smartwatches', name: 'ساعات ذكية', icon: 'watch', count: getCategoryCount('smartwatches') },
  { id: 'audio', name: 'سماعات وصوتيات', icon: 'headphones', count: getCategoryCount('audio') },
  { id: 'perfumes', name: 'عطور وبخور', icon: 'sanitizer', count: getCategoryCount('perfumes') },
  { id: 'accessories', name: 'إكسسوارات وهواتف', icon: 'smartphone', count: getCategoryCount('accessories') },
];

export const MOCK_ORDERS: OrderStatus[] = [
  {
    id: 'ord-101',
    orderNumber: 'IND-8921',
    customerName: 'أحمد عبدالله باوزير',
    phone: '771234567',
    governorate: 'أمانة العاصمة (صنعاء)',
    address: 'شارع حدة - بجانب مركز صخر التكنولوجي',
    items: [
      { productName: 'ساعة ذكية AMOLED Ultra 8', quantity: 1, price: 28000 },
      { productName: 'سماعات لاسلكية Pro ANC', quantity: 1, price: 21000 }
    ],
    totalPriceYER: 49000,
    status: 'out_for_delivery',
    statusLabel: 'جاري التوصيل الآن مع المندوب 🛵',
    date: '06 أغسطس 2026',
    paymentMethod: 'الدفع عند الاستلام (نقداً)'
  },
  {
    id: 'ord-102',
    orderNumber: 'IND-7734',
    customerName: 'سارة محمد الحيمي',
    phone: '779876543',
    governorate: 'عدن',
    address: 'المنصورة - حي ريمي - بجانب جولة الكراع',
    items: [
      { productName: 'عطر عود الملكي الفاخر', quantity: 2, price: 16800 }
    ],
    totalPriceYER: 33600,
    status: 'shipped',
    statusLabel: 'تم الشحن عبر مكتب التوصيل 🚚',
    date: '05 أغسطس 2026',
    paymentMethod: 'حساب بنك الكريمي (حاسب)'
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'تخفيضات الكبرى وصلت! 🔥',
    message: 'خصم حقيقي يصل حتى 30% على جميع الساعات الذكية والسماعات لفترة محدودة.',
    time: 'منذ ساعتين',
    read: false,
    type: 'offer'
  },
  {
    id: 'notif-2',
    title: 'شحن مجاني إلى جميع المحافظات 🚚',
    message: 'اطلب الآن بقيمة 30,000 ريال يمني أو أكثر واحصل على شحن مجاني مباشر لباب بيتك.',
    time: 'منذ يوم واحد',
    read: true,
    type: 'offer'
  },
  {
    id: 'notif-3',
    title: 'طلبك رقم #IND-8921 خرج للتوصيل',
    message: 'سيقوم مندوب متجر إندكس بالتواصل معك خلال الساعات القادمة لتسليم الطلب.',
    time: 'منذ 3 ساعات',
    read: false,
    type: 'order'
  }
];

export const HERO_SLIDES = [
  {
    id: 'slide-1',
    title: 'الساعات الذكية الأكثر مبيعاً 2026',
    subtitle: 'تقنيات متطورة، شاشة AMOLED وتصميم فاخر مقاوم للماء',
    badge: '🔥 عرض حاص لفترة محدودة',
    cta: 'تسوق الساعات الآن',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=80',
    categoryId: 'smartwatches'
  },
  {
    id: 'slide-2',
    title: 'تشكيلة عطور العود والبخور الفاخرة',
    subtitle: 'ثبات يدوم طويلاً مع تركيبة عطرية يمنية ملكية مميزة',
    badge: '✨ أصالة وأناقة',
    cta: 'تصفح العطور',
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80',
    categoryId: 'perfumes'
  },
  {
    id: 'slide-3',
    title: 'عزل الضوضاء الحقيقي وتجربة صوتية نقية',
    subtitle: 'سماعات Pro ANC مع ضمان لمدة سنة كاملة من متجر إندكس',
    badge: '🎧 خصم 25% اليوم',
    cta: 'اطلب سماعاتك',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    categoryId: 'audio'
  }
];
