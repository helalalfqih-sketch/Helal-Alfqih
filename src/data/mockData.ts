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

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'الكل', icon: 'grid_view', count: 18 },
  { id: 'smartwatches', name: 'ساعات ذكية', icon: 'watch', count: 5 },
  { id: 'audio', name: 'سماعات وصوتيات', icon: 'headphones', count: 4 },
  { id: 'perfumes', name: 'عطور وبخور', icon: 'sanitizer', count: 3 },
  { id: 'appliances', name: 'أجهزة منزلية', icon: 'kitchen', count: 3 },
  { id: 'accessories', name: 'إكسسوارات وهواتف', icon: 'smartphone', count: 3 },
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'ساعة ذكية AMOLED Ultra 8',
    subtitle: 'شاشة AMOLED عالية الدقة',
    description: 'ساعة ذكية متطورة تتميز بشاشة AMOLED مقاس 2.02 بوصة غير قابلة للخدش، تدعم المكالمات البلوتوث وتتبع الأنشطة الرياضية والنبض والأكسجين، مقاومة للماء والسباحة وبطارية تدوم حتى 7 أيام.',
    priceYER: 28000,
    originalPriceYER: 40000,
    discountBadge: 'خصم 30%',
    rating: 4.8,
    reviewsCount: 128,
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'smartwatches',
    inStock: true,
    isBestOffer: true,
    isFeatured: true,
    specs: {
      'الشاشة': '2.02 بوصة AMOLED',
      'البطارية': '450mAh (تيدوم 7 أيام)',
      'الاتصال': 'بلوتوث 5.2 (مكالمات صوتیة)',
      'المقاومة للماء': 'IP68',
      'الضمان': 'سنة كاملة'
    },
    colors: ['#000000', '#7B3FFF', '#C0C0C0']
  },
  {
    id: 'prod-2',
    name: 'سماعات لاسلكية Pro ANC',
    subtitle: 'عزل ضوضاء نشط متطور',
    description: 'سماعات أذن لاسلكية بتقنية إلغاء الضوضاء النشط (ANC) والصوت المحيطي النقية. ميكروفون مزدوج واضح للمكالمات مع علبة شحن لاسلكية وبطارية تدوم حتى 30 ساعة مع علبة الشحن.',
    priceYER: 21000,
    originalPriceYER: 28000,
    discountBadge: 'خصم 25%',
    rating: 4.7,
    reviewsCount: 96,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'audio',
    inStock: true,
    isBestOffer: true,
    isFeatured: true,
    specs: {
      'عزل الضوضاء': 'نشط حتى 35dB',
      'البطارية': '6 ساعات (30 ساعة مع العلبة)',
      'الشحن': 'USB-C وشحن لاسلكي',
      'الضمان': 'سنة كاملة'
    },
    colors: ['#FFFFFF', '#100B1A', '#FFB800']
  },
  {
    id: 'prod-3',
    name: 'عطر عود الملكي الفاخر',
    subtitle: 'تركيز عالي وثبات يدوم طويلاً',
    description: 'مزيج ساحر من دهن العود الكمبودي المعتق مع نفحات من الورد الطائفي والعنبر الخالص. عطر فخم يعكس الأصالة والأناقة في المناسبات الرسمية مع ثبات يستمر لأكثر من 48 ساعة.',
    priceYER: 16800,
    originalPriceYER: 21000,
    discountBadge: 'خصم 20%',
    rating: 4.9,
    reviewsCount: 73,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'perfumes',
    inStock: true,
    isBestOffer: true,
    isFeatured: true,
    specs: {
      'الحجم': '100 مل',
      'التركيز': 'Eau de Parfum مكثف',
      'الثبات': 'أكثر من 48 ساعة',
      'المنشأ': 'تركيبة خاصة حصرياً لمتجر إندكس'
    }
  },
  {
    id: 'prod-4',
    name: 'قلاية هوائية رقمية 4.5 لتر',
    subtitle: 'متعددة الاستخدام بدون زيت',
    description: 'قلاية هوائية ذكية بلمس رقمي و8 برامج إعداد مسبق للطهي الصحي بدون أواني ولا زيوت. قوة 1500 واط مع سلة غير لاصقة سهلة التنظيف وسريعة القلي.',
    priceYER: 40500,
    originalPriceYER: 47500,
    discountBadge: 'خصم 15%',
    rating: 4.6,
    reviewsCount: 62,
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'appliances',
    inStock: true,
    isBestOffer: true,
    isFeatured: false,
    specs: {
      'السعة': '4.5 لتر',
      'القوة': '1500 واط',
      'البرامج': '8 برامج طهي تلقائية',
      'الضمان': 'سنتين شامل'
    },
    colors: ['#000000', '#333333']
  },
  {
    id: 'prod-5',
    name: 'مكبر صوت بلوتوث حفل مع إضاءة RGB',
    subtitle: 'صوت جهير قوي وصوت نقي',
    description: 'مكبر صوت محمول بقوة 40 واط مع إضاءة RGB ديناميكية تتفاعل مع إيقاع الموسيقى. مقاوم للماء IPX7، مدخل ميكروفون للكركي وبطارية تدوم 15 ساعة متواصلة.',
    priceYER: 32000,
    originalPriceYER: 42000,
    discountBadge: 'خصم 24%',
    rating: 4.9,
    reviewsCount: 54,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
    category: 'audio',
    inStock: true,
    isBestOffer: false,
    isNewArrival: true,
    specs: {
      'القوة الصوتية': '40W RMS Bass',
      'الاتصال': 'بلوتوث 5.3 / AUX / USB / SD',
      'البطارية': '6000mAh',
      'المقاومة': 'IPX7 مضاد للمياه'
    }
  },
  {
    id: 'prod-6',
    name: 'ساعة رياضية تكتيكية GPS Pro',
    subtitle: 'مقاومة الصدمات والأجواء القاسية',
    description: 'ساعة ذكية مخصصة للمغامرات مع بوصلة ومقياس ارتفاع وضغط جوي. هيكل من التيتانيوم القوي، بطارية شمسية تدوم حتى 20 يوماً وتتبع كامل للخرائط والمسارات.',
    priceYER: 49000,
    originalPriceYER: 62000,
    discountBadge: 'خصم 21%',
    rating: 4.9,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    category: 'smartwatches',
    inStock: true,
    isBestOffer: false,
    isNewArrival: true,
    specs: {
      'المادة': 'تيتانيوم وزجاج ياقوتي مقاوم للخدش',
      'نظام GPS': 'مزدوج النطاق خماسي الأقمار',
      'مقاومة الماء': '100 متر (10 ATM)',
      'الضمان': 'سنتين'
    }
  },
  {
    id: 'prod-7',
    name: 'طقم عطر وبخور إندكس الملكي',
    subtitle: 'صندوق هدايا فاخر يحتوي على عطر ومعمول بخور',
    description: 'مجموعة إندكس الحصرية المكونة من عطر عودي 100 مل + قارورة معمول بخور دوسري فاخر + مبخرة كريستالية أنيقة. الهدية المثالية للأعراس والمناسبات.',
    priceYER: 35000,
    originalPriceYER: 45000,
    discountBadge: 'عكـس خاص',
    rating: 5.0,
    reviewsCount: 41,
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
    category: 'perfumes',
    inStock: true,
    isBestOffer: false,
    isNewArrival: true,
    specs: {
      'المحتويات': 'عطر 100 مل + معمول بخور + مبخرة فاخرة',
      'التغليف': 'صندوق خشبي مخملي راقي'
    }
  },
  {
    id: 'prod-8',
    name: 'شاحن سريع متعدّد المنافذ 100W GaN',
    subtitle: 'شحن 4 أجهزة بنفس الوقت بقدرة فائقة',
    description: 'شاحن جداري بتقنية نتريد الغاليوم (GaN) المتقدمة. يحتوي على 3 منافذ Type-C ومنفذ USB-A، يشحن اللابتوب والهواتف والساعات بأقصى سرعة وأمان.',
    priceYER: 19500,
    originalPriceYER: 26000,
    discountBadge: 'خصم 25%',
    rating: 4.8,
    reviewsCount: 110,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
    category: 'accessories',
    inStock: true,
    isBestOffer: false,
    specs: {
      'القدرة القصوى': '100 واط PD 3.0',
      'المنافذ': '3x USB-C + 1x USB-A',
      'الأمان': 'حماية ضد التيار الزائد والحرارة'
    }
  },
  {
    id: 'prod-9',
    name: 'ماكينة حلاقة وتشذيب احترافية متكاملة',
    subtitle: 'محرك توربو وشفرات تيتانيوم',
    description: 'مجموعة العناية الكاملة للرجال. ماكينة حلاقة وشعر وذقن مع 6 أمشاط مختلفة وشاشة LED لمستوى البطارية وشحن USB سريع.',
    priceYER: 15500,
    originalPriceYER: 22000,
    discountBadge: 'خصم 29%',
    rating: 4.7,
    reviewsCount: 79,
    image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80',
    category: 'appliances',
    inStock: true,
    isBestOffer: false,
    specs: {
      'البطارية': 'ليثيوم 2000mAh (عمل 180 دقيقة)',
      'الشفرة': 'تيتانيوم وسيراميك ذاتي الشحذ',
      'الشحن': 'USB Type-C'
    }
  }
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
