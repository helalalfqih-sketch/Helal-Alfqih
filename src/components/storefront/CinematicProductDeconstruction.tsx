import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  Sliders,
  ShieldCheck,
  Cpu,
  Zap,
  Activity,
  Crosshair,
  Heart,
  RefreshCw,
  Volume2,
  Flame,
  Droplet,
  Settings,
  Radio,
  X,
} from "lucide-react";
import { Product } from "./types";

interface ComponentLayer {
  id: string;
  nameAr: string;
  nameEn: string;
  materialAr: string;
  materialEn: string;
  specsAr: string;
  offsetZ: number; // Distance in exploded view along Z-axis
  type:
    | "glass"
    | "display"
    | "case"
    | "gasket"
    | "motherboard"
    | "battery"
    | "speaker"
    | "sensor"
    | "silicone"
    | "liquid";
  color: string;
  icon: string;
}

export type CategoryType =
  "speaker" | "audio" | "smartwatches" | "perfumes" | "appliance" | "generic";

interface CinematicProps {
  onClose?: () => void;
  productName?: string;
  productImage?: string;
  category?: string;
  product?: Product;
}

// Helper to determine category type based on name & category string
// eslint-disable-next-line react-refresh/only-export-components
export const getProductCategoryType = (name: string, category?: string): CategoryType => {
  const cat = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();

  // 1. Check Bluetooth Speaker / Speaker FIRST before general 'audio' or 'سماعة'
  if (
    cat.includes("speaker") ||
    cat.includes("مكبر") ||
    cat.includes("سبيكر") ||
    cat.includes("صوتيات") ||
    n.includes("مكبر") ||
    n.includes("سبيكر") ||
    n.includes("speaker") ||
    n.includes("ساوند بار") ||
    n.includes("soundbar")
  ) {
    return "speaker";
  }

  // 2. Earbuds / Headphones / ANC Audio
  if (
    n.includes("إيربودز") ||
    n.includes("يربودز") ||
    n.includes("earbud") ||
    n.includes("airpods") ||
    n.includes("anc") ||
    n.includes("سماعة أذن") ||
    n.includes("سماعة بلوتوث أذن") ||
    (n.includes("سماعة") && !n.includes("مكبر")) ||
    n.includes("headphone") ||
    cat === "audio"
  ) {
    return "audio";
  }

  // 3. Smartwatches & Wearables
  if (
    cat === "smartwatches" ||
    n.includes("ساعة") ||
    n.includes("watch") ||
    n.includes("amoled") ||
    n.includes("ultra") ||
    n.includes("سوار")
  ) {
    return "smartwatches";
  }

  // 4. Perfumes & Fragrances
  if (
    cat === "perfumes" ||
    n.includes("عطر") ||
    n.includes("perfume") ||
    n.includes("oud") ||
    n.includes("عود") ||
    n.includes("مسك")
  ) {
    return "perfumes";
  }

  // 5. Home Appliances
  if (
    cat === "appliance" ||
    n.includes("خلاط") ||
    n.includes("ماكينة") ||
    n.includes("فرن") ||
    n.includes("قلاية")
  ) {
    return "appliance";
  }

  // 6. Generic Fallback for any other product
  return "generic";
};

// Dynamic Layer Generators per Category Type
const getLayersForCategory = (catType: CategoryType, productName: string): ComponentLayer[] => {
  switch (catType) {
    case "speaker":
      return [
        {
          id: "speaker-layer-1",
          nameAr: "الهيكل الخشبي العازل (Acoustic Cabinet)",
          nameEn: "Acoustic Composite Wooden Cabinet",
          materialAr: "خشب MDF مضغوط وعازل للرنين مع طبقة نانو كربونية",
          materialEn: "Resonance-Damped MDF Composite Shell",
          specsAr: "امتصاص الاهتزازات الجانبية وإخراج باس خالص ونقي جداً",
          offsetZ: 210,
          type: "case",
          color: "#F59E0B",
          icon: "box",
        },
        {
          id: "speaker-layer-2",
          nameAr: "حلقة الإضاءة التفاعلية (RGB Lighting Ring)",
          nameEn: "360° Interactive RGB Spectrum Ring",
          materialAr: "حلقة أكريليك مشعة مع 32 LED عالية السطوع",
          materialEn: "Diffuse Acrylic Ring with 32 Addressable LEDs",
          specsAr: "تزامن ضوئي حي ومباشر مع إيقاع الموسيقى والترددات",
          offsetZ: 150,
          type: "glass",
          color: "#38BDF8",
          icon: "sparkles",
        },
        {
          id: "speaker-layer-3",
          nameAr: "مضخم الصوت المزدوج (High-Excursion Subwoofer)",
          nameEn: "Dual High-Excursion Bass Woofer Driver",
          materialAr: "مخروط ألياف الكفلار مع مغناطيس نيوديميوم N52 الحجم الكبيرة",
          materialEn: "Kevlar Reinforced Cone with N52 Magnet",
          specsAr: "قدرة 45W RMS واستجابة ترددات باس عميقة جداً تصل لـ 35Hz",
          offsetZ: 90,
          type: "speaker",
          color: "#EF4444",
          icon: "volume",
        },
        {
          id: "speaker-layer-4",
          nameAr: "لوحة معالجة الصوت والاتصال (Audio DSP Board)",
          nameEn: "DSP Audio Neural & Bluetooth 5.3 PCB",
          materialAr: "لوحة مطبوعة معالجة مطلية بالذهب مع شرائح DSP",
          materialEn: "Gold-Plated PCB with 32-bit Audio DSP",
          specsAr: "بلوتوث 5.3 منخفض التأخير مع معالجة إشارة عالي الدقة 24-bit/96kHz",
          offsetZ: 30,
          type: "motherboard",
          color: "#10B981",
          icon: "cpu",
        },
        {
          id: "speaker-layer-5",
          nameAr: "بطارية الليثيوم العملاقة (5000mAh Battery)",
          nameEn: "High-Capacity 5000mAh Li-ion Battery",
          materialAr: "خلايا ليثيوم أيون مع درع حماية حراري من الألومنيوم",
          materialEn: "High-Density Dual Li-ion Cells",
          specsAr: "تشغيل متواصل لمدة 18 ساعة مع مخرج شحن عكسي Power Bank",
          offsetZ: -30,
          type: "battery",
          color: "#8B5CF6",
          icon: "zap",
        },
        {
          id: "speaker-layer-6",
          nameAr: "مشع الباس الخفي المزدوج (Passive Radiator)",
          nameEn: "Dual Passive Bass Radiator System",
          materialAr: "غشاء مطاطي مرن مع قرص ألومنيوم لتعزيز الباس",
          materialEn: "High-Compliance Rubber & Aluminum Disc",
          specsAr: "تضخيم الترددات المنخفضة بدون استهلاك إضافي للطاقة",
          offsetZ: -90,
          type: "gasket",
          color: "#EC4899",
          icon: "activity",
        },
        {
          id: "speaker-layer-7",
          nameAr: "قواعد التثبيت الممتصة للاهتزاز (Anti-Vibration Base)",
          nameEn: "Anti-Vibration Non-Slip Silicone Feet",
          materialAr: "مطاط نانو سيليكون ممتص للصدمات والاهتزازات",
          materialEn: "High-Damping Non-Slip Silicone Array",
          specsAr: "ثبات تام على الأسطح الخشبية والزجاجية عند أقصى مستوى صوت",
          offsetZ: -150,
          type: "sensor",
          color: "#E4E4E7",
          icon: "shield",
        },
      ];

    case "audio":
      return [
        {
          id: "audio-layer-1",
          nameAr: "وسادة السيليكون الطبية المريحة",
          nameEn: "Medical Silicone Ear Tip",
          materialAr: "سيليكون نانو مرن مضاد للحساسية بدرجة عزل 30dB",
          materialEn: "Hypoallergenic Medical Silicone Seal",
          specsAr: "عزل ضوضاء إيجابي، ملمس حريري يناسب كافة مقاسات الأذن",
          offsetZ: 210,
          type: "silicone",
          color: "#38BDF8",
          icon: "shield",
        },
        {
          id: "audio-layer-2",
          nameAr: "الحجرة الصوتية الهندسية",
          nameEn: "Acoustic Tuning Chamber",
          materialAr: "بولي كربونات مصقول عالي المتانة بتقنية CNC",
          materialEn: "Precision CNC Machined Polycarbonate",
          specsAr: "توجيه دقيق للترددات العالية والمنخفضة لتجربة صوت ثلاثية الأبعاد",
          offsetZ: 150,
          type: "case",
          color: "#E4E4E7",
          icon: "box",
        },
        {
          id: "audio-layer-3",
          nameAr: "مكبر الصوت التيتانيوم 11mm",
          nameEn: "11mm Titanium Dynamic Driver",
          materialAr: "غشاء تيتانيوم مركب مع مغناطيس نيوديميوم N52",
          materialEn: "N52 Neodymium Titanium Diaphragm",
          specsAr: "صوت باس عميق جداً وترددات نقية مع استجابة 20Hz-20kHz",
          offsetZ: 90,
          type: "speaker",
          color: "#F59E0B",
          icon: "volume",
        },
        {
          id: "audio-layer-4",
          nameAr: "معالج إلغاء الضوضاء الذكي H2 ANC",
          nameEn: "H2 Smart ANC Neural Audio Processor",
          materialAr: "شريحة معالجة الصوت المزدوجة بالذكاء الاصطناعي",
          materialEn: "AI Audio DSP Board with Dual Core",
          specsAr: "إلغاء الضوضاء النشط حتى 48dB مع نمط الشفافية التكيفية",
          offsetZ: 30,
          type: "motherboard",
          color: "#10B981",
          icon: "cpu",
        },
        {
          id: "audio-layer-5",
          nameAr: "بطارية الليثيوم المصغرة High-Density",
          nameEn: "Micro Li-ion Battery Cell (55mAh)",
          materialAr: "خلايا ليثيوم بوليمر زرية فائقة الكثافة",
          materialEn: "High-Density Micro Li-ion Polymer",
          specsAr: "عمل متواصل حتى 8 ساعات شحنة واحدة + شحن سريع 10 دقائق",
          offsetZ: -30,
          type: "battery",
          color: "#EF4444",
          icon: "zap",
        },
        {
          id: "audio-layer-6",
          nameAr: "الميكروفونات الثنائية لعزل المكالمات",
          nameEn: "Dual Beamforming ANC Mics",
          materialAr: "ميكروفونات MEMS دقيقة بنظام تصفية الرياح",
          materialEn: "MEMS Array Mics with Wind Resistance",
          specsAr: "التقاط بصمة الصوت النقي وإلغاء ضوضاء الخلفية أثناء المكالمات",
          offsetZ: -90,
          type: "sensor",
          color: "#8B5CF6",
          icon: "radio",
        },
        {
          id: "audio-layer-7",
          nameAr: "قاعدة الشحن المغناطيسية IPX5",
          nameEn: "Magnetic Gold Charging Base",
          materialAr: "ملامسات نانو مذهبة مقاومة للماء والتعرق IPX5",
          materialEn: "Gold-Plated Contacts & Waterproof Seal",
          specsAr: "تثبيت مغناطيسي فوري داخل العلبة وشحن فائق السرعة",
          offsetZ: -150,
          type: "gasket",
          color: "#EC4899",
          icon: "sparkles",
        },
      ];

    case "perfumes":
      return [
        {
          id: "perfume-layer-1",
          nameAr: "الغطاء المغناطيسي الفاخر",
          nameEn: "24K Gold Magnetic Heavy Cap",
          materialAr: "سبائك الزنك المطلية بالذهب المصقول عيار 24",
          materialEn: "24K Gold Plated Heavy Zinc Alloy",
          specsAr: "إغلاق مغناطيسي محكم يمنع تطاير النوتات العطرية",
          offsetZ: 190,
          type: "case",
          color: "#F59E0B",
          icon: "box",
        },
        {
          id: "perfume-layer-2",
          nameAr: "مضخة الرش الميكرونية الدقيقة",
          nameEn: "Precision Micro-Atomizer Pump",
          materialAr: "مضخة ذهبية برذاذ ناعم جداً بانتشار 120 درجة",
          materialEn: "Brass Fine Mist Spray Nozzle",
          specsAr: "توزيع العطر بالتساوي على جزيئات ناعمة تثبت لفترة أطول",
          offsetZ: 130,
          type: "speaker",
          color: "#38BDF8",
          icon: "droplet",
        },
        {
          id: "perfume-layer-3",
          nameAr: "حلقة الإغلاق والختم العازل",
          nameEn: "Airtight Silicone Neck Gasket",
          materialAr: "مطاط نيوبليك لإحكام حفظ الزيوت العطرية",
          materialEn: "Airtight Vacuum Sealing Ring",
          specsAr: "حماية كاملة ضد الأكسدة والتسرب لضمان ثبات العطر لساعات",
          offsetZ: 70,
          type: "gasket",
          color: "#10B981",
          icon: "shield",
        },
        {
          id: "perfume-layer-4",
          nameAr: "القلب العطري - الزيوت المركزة 30%",
          nameEn: "Concentrated Fragrance Oil Heart",
          materialAr: "خلاصة الزيوت العطرية والعود والمسك النادر",
          materialEn: "30% Pure Essential Perfume Extract",
          specsAr: "تركيز Parfum الفاخر مع فوحان قوي يدوم لأكثر من 24 ساعة",
          offsetZ: 0,
          type: "liquid",
          color: "#F59E0B",
          icon: "sparkles",
        },
        {
          id: "perfume-layer-5",
          nameAr: "قارورة الزجاج البلوري الكريستالي",
          nameEn: "Hand-Cut Heavy Crystal Glass Flacon",
          materialAr: "زجاج كريستالي سميك مقاوم للصدمات والحرارة",
          materialEn: "Ultra-Clear High-Density Glass Body",
          specsAr: "نقاوة زجاجية 99% تحمي المزيج العطري من الضوء والحرارة",
          offsetZ: -70,
          type: "glass",
          color: "#8B5CF6",
          icon: "shield",
        },
        {
          id: "perfume-layer-6",
          nameAr: "القاعدة الزجاجية الثقيلة المحفورة",
          nameEn: "Weighted Glass Base Foundation",
          materialAr: "قاعدة زجاجية محفورة بشعار إندكس الملكي",
          materialEn: "Solid Crystal Base with Engraved Logo",
          specsAr: "ثبات ممتاز ومنظر فخم يزين طاولتك العطرية",
          offsetZ: -140,
          type: "sensor",
          color: "#EC4899",
          icon: "heart",
        },
      ];

    case "appliance":
      return [
        {
          id: "app-layer-1",
          nameAr: "الدرع الخارجي المقوى الحامي",
          nameEn: "Reinforced Protective Front Shield",
          materialAr: "بولي كربونات شفاف مقاوم للصدمات والخدش",
          materialEn: "Impact-Resistant Polycarbonate Shield",
          specsAr: "حماية للهيكل الداخلي مع لمسة جمالية متناسقة",
          offsetZ: 200,
          type: "glass",
          color: "#38BDF8",
          icon: "shield",
        },
        {
          id: "app-layer-2",
          nameAr: "لوحة التحكم الرقمية ومصفوفة LED",
          nameEn: "Digital Control Display Matrix",
          materialAr: "شاشة تحكم باللمس مع إضاءة خلفية LED",
          materialEn: "Touch Smart Interface Panel",
          specsAr: "استجابة فورية للمسات واختيار الأنماط والسرعات",
          offsetZ: 140,
          type: "display",
          color: "#7B3FFF",
          icon: "monitor",
        },
        {
          id: "app-layer-3",
          nameAr: "هيكل السبيكة المعدنية CNC Casing",
          nameEn: "CNC Machined Alloy Enclosure",
          materialAr: "ألومنيوم مصقول بتقنية الليزر عالية الدقة",
          materialEn: "High-Precision Aluminum Frame",
          specsAr: "صلابة خفيفة الوزن مع تشتيت سريع للحرارة",
          offsetZ: 80,
          type: "case",
          color: "#E4E4E7",
          icon: "box",
        },
        {
          id: "app-layer-4",
          nameAr: "العازل الحراري وموزع التبريد",
          nameEn: "Thermal Copper Heat Sink & Seal",
          materialAr: "شرائح نحاسية نانو مع عازل حراري",
          materialEn: "Copper Thermal Pad & Dampener",
          specsAr: "تخفيض الضوضاء ومنع ارتفاع الحرارة أثناء التشغيل المكثف",
          offsetZ: 20,
          type: "gasket",
          color: "#F59E0B",
          icon: "droplet",
        },
        {
          id: "app-layer-5",
          nameAr: "الشريحة الرئيسية ولوحة التحكم الذكية",
          nameEn: "Smart PCB Micro-Board",
          materialAr: "لوحة مطبوعة مع معالج تحكم ذكي دقيق",
          materialEn: "Gold-Plated PCB Control Logic Unit",
          specsAr: "إدارة الذكاء الاصطناعي للطاقة والسرعات والأمان",
          offsetZ: -40,
          type: "motherboard",
          color: "#10B981",
          icon: "cpu",
        },
        {
          id: "app-layer-6",
          nameAr: "وحدة بطارية الطاقة عالية الكثافة",
          nameEn: "High-Density Power Unit",
          materialAr: "خلايا ليثيوم طويلة العمر مع أمان متعدد",
          materialEn: "Li-ion Polymer Power Pack",
          specsAr: "توفير طاقة مستقرة بدون انقطاع مع حماية من الفولت الزائد",
          offsetZ: -100,
          type: "battery",
          color: "#EF4444",
          icon: "zap",
        },
        {
          id: "app-layer-7",
          nameAr: "المحرك الكهربائي عالي العزم",
          nameEn: "High-Torque Precision Motor Engine",
          materialAr: "محرك بدون فرش (Brushless) فائق الهدوء",
          materialEn: "Brushless High-Speed Motor Core",
          specsAr: "دوران سريع جداً بقدرة عالية وعمر افتراضي طويل",
          offsetZ: -150,
          type: "speaker",
          color: "#8B5CF6",
          icon: "activity",
        },
        {
          id: "app-layer-8",
          nameAr: "القاعدة الثابتة وقواعد تثبيت النانو",
          nameEn: "Heavy Base & Anti-Vibration Pads",
          materialAr: "مطاط سيليكون ممتص للاهتزازات",
          materialEn: "Non-Slip Anti-Vibration Rubber Base",
          specsAr: "ثبات تام على جميع الأسطح أثناء التشغيل",
          offsetZ: -200,
          type: "sensor",
          color: "#EC4899",
          icon: "heart",
        },
      ];

    case "smartwatches":
      return [
        {
          id: "watch-layer-1",
          nameAr: "عدسة الكريستال الياقوتي (Sapphire Crystal)",
          nameEn: "Sapphire Crystal Glass Lens",
          materialAr: "كريستال ياقوتي مضاد للخدش بدرجة صلابة 9H",
          materialEn: "9H Scratch-Resistant Sapphire Crystal",
          specsAr: "طلاء مضاد للانعكاس، انحناء 2.5D مدمج",
          offsetZ: 210,
          type: "glass",
          color: "#38BDF8",
          icon: "shield",
        },
        {
          id: "watch-layer-2",
          nameAr: "شاشة AMOLED مقاس 2.02 بوصة",
          nameEn: '2.02" HD AMOLED Display Matrix',
          materialAr: "لوحة AMOLED بسطوع يصل إلى 1000 nits",
          materialEn: "1000 nits Ultra Bright AMOLED Matrix",
          specsAr: "دقة 485x520 بكسل، تردد 60Hz بلمس ثنائي",
          offsetZ: 150,
          type: "display",
          color: "#7B3FFF",
          icon: "monitor",
        },
        {
          id: "watch-layer-3",
          nameAr: "الإطار الخارجي من التيتانيوم الفضائي",
          nameEn: "Grade 5 Aerospace Titanium Casing",
          materialAr: "تيتانيوم مصقول بتقنية CNC عالية الدقة",
          materialEn: "CNC Machined Grade 5 Titanium Alloy",
          specsAr: "زر التاج الرقمي الدوار + زر الفعاليات البرتقالي",
          offsetZ: 90,
          type: "case",
          color: "#E4E4E7",
          icon: "box",
        },
        {
          id: "watch-layer-4",
          nameAr: "مانع التسريب الحراري والمائي IP68",
          nameEn: "Thermal Dissipation & IP68 Gasket Seal",
          materialAr: "مطاط سيليكون فلوري + رقاقة نحاسية",
          materialEn: "Fluororubber Seal & Copper Heat Spreader",
          specsAr: "مقاومة الماء حتى عمق 50 متراً تحت الماء",
          offsetZ: 30,
          type: "gasket",
          color: "#F59E0B",
          icon: "droplet",
        },
        {
          id: "watch-layer-5",
          nameAr: "اللوحة الأم الشريحة الذكية S8 Dual-Core",
          nameEn: "S8 Dual-Core High-Speed Motherboard",
          materialAr: "شرائح متكاملة مع وصلات ذهبية",
          materialEn: "Gold-Plated PCB with S8 Neural Processor",
          specsAr: "ذاكرة 128MB + بلوتوث 5.2 مزدوج للمكالمات",
          offsetZ: -30,
          type: "motherboard",
          color: "#10B981",
          icon: "cpu",
        },
        {
          id: "watch-layer-6",
          nameAr: "بطارية الليثيوم المتقدمة 450mAh",
          nameEn: "450mAh High-Density Polymer Battery",
          materialAr: "خلايا ليثيوم بوليمر عالية الكثافة",
          materialEn: "High-Density Li-Polymer Battery Cell",
          specsAr: "تشغيل يدوم حتى 7 أيام + شحن مغناطيسي سريع",
          offsetZ: -90,
          type: "battery",
          color: "#EF4444",
          icon: "zap",
        },
        {
          id: "watch-layer-7",
          nameAr: "مكثف النبضات Haptic Taptic Engine",
          nameEn: "Precision Linear Haptic Motor",
          materialAr: "محرك اهتزاز خطي ومكبر صوت ستيريو",
          materialEn: "Linear Vibration Motor & Stereo Speaker",
          specsAr: "استجابة لمسية فائقة مع طرد المياه التلقائي",
          offsetZ: -145,
          type: "speaker",
          color: "#8B5CF6",
          icon: "activity",
        },
        {
          id: "watch-layer-8",
          nameAr: "الغطاء الخلفي السيراميكي مع مستشعرات الصحة",
          nameEn: "Ceramic Caseback & Optical Bio-Sensors",
          materialAr: "سيراميك زيركونيا مع 8 عدسات ضوئية",
          materialEn: "Zirconia Ceramic with 8-LED Optical Array",
          specsAr: "قياس نبضات القلب SpO2 والتخطيط الكهربائي ECG",
          offsetZ: -205,
          type: "sensor",
          color: "#EC4899",
          icon: "heart",
        },
      ];

    case "generic":
    default:
      return [
        {
          id: "gen-layer-1",
          nameAr: "الهيكل الخارجي المقوى (Protective Shell)",
          nameEn: "Reinforced Polymer Outer Shell",
          materialAr: "بولي كربونات مصقول مقاوم للصدمات والخدوش",
          materialEn: "Precision Molded Impact Polycarbonate",
          specsAr: "حماية كاملة للمكونات الداخلية مع تصميم عصري متناسق",
          offsetZ: 200,
          type: "glass",
          color: "#38BDF8",
          icon: "shield",
        },
        {
          id: "gen-layer-2",
          nameAr: "الشاسي الداخلي للمكونات (Internal Chassis)",
          nameEn: "High-Precision Internal Chassis",
          materialAr: "سبيكة ألومنيوم خفيفة الوزن ومقاومة للحرارة",
          materialEn: "Lightweight Structural Alloy Frame",
          specsAr: "تثبيت متين للأجزاء مع توزيع متناسق للوزن",
          offsetZ: 120,
          type: "case",
          color: "#E4E4E7",
          icon: "box",
        },
        {
          id: "gen-layer-3",
          nameAr: "لوحة التحكم والتشغيل المركزية (Smart PCB)",
          nameEn: "Smart Micro-Control Main Logic Board",
          materialAr: "لوحة إلكترونية مطبوعة مع شرائح تنظيم الجهد",
          materialEn: "Gold-Plated Printed Circuit Board",
          specsAr: "إدارة ذكية للوظائف والكفاءة العالية في استهلاك الطاقة",
          offsetZ: 40,
          type: "motherboard",
          color: "#10B981",
          icon: "cpu",
        },
        {
          id: "gen-layer-4",
          nameAr: "وحدة التغذية بالكهرباء والطاقة (Power Pack)",
          nameEn: "Advanced Lithium Power Module",
          materialAr: "خلايا طاقة مستقرة بنظام أمان ثنائي ضد الفولت الزائد",
          materialEn: "High-Safety Polymer Battery Cell",
          specsAr: "توفير تيار كهربائي ثابت وأداء آمن ومستدام",
          offsetZ: -40,
          type: "battery",
          color: "#EF4444",
          icon: "zap",
        },
        {
          id: "gen-layer-5",
          nameAr: "رقاقة التبريد والعزل الحراري (Thermal Dissipation)",
          nameEn: "Thermal Dissipation Copper Pad & Gasket",
          materialAr: "شرائح نحاسية نانوية مع مانع تسريب سيليكوني",
          materialEn: "Nano-Copper Sink with Silicone Seal",
          specsAr: "تشتيت الحرارة بفاعلية وحماية المكونات من الارتفاع الحراري",
          offsetZ: -100,
          type: "gasket",
          color: "#F59E0B",
          icon: "droplet",
        },
        {
          id: "gen-layer-6",
          nameAr: "قاعدة التثبيت المانعة للانزلاق (Heavy Foundation)",
          nameEn: "Heavy Rubber Base Foundation",
          materialAr: "قاعدة ثقيلة بقطع مطاطية مضادة للانزلاق",
          materialEn: "Weighted Anti-Slip Base Ring",
          specsAr: "ثبات ممتاز ومنع الانزلاق على كافة الأسطح",
          offsetZ: -160,
          type: "sensor",
          color: "#EC4899",
          icon: "heart",
        },
      ];
  }
};

export const CinematicProductDeconstruction: React.FC<CinematicProps> = ({
  onClose,
  productName = "ساعة ذكية AMOLED Ultra 8",
  category,
}) => {
  // Detect Category Type dynamically
  const categoryType = useMemo(
    () => getProductCategoryType(productName, category),
    [productName, category],
  );

  // Dynamic Layer List
  const layers = useMemo(
    () => getLayersForCategory(categoryType, productName),
    [categoryType, productName],
  );

  // Animation State
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0); // 0 to 25 seconds
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [explodedFactor, setExplodedFactor] = useState(1); // 0.2 to 1.8
  const [selectedLayer, setSelectedLayer] = useState<ComponentLayer | null>(null);
  const [cameraView, setCameraView] = useState<"orbit" | "exploded" | "macro" | "assembled">(
    "orbit",
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);

  // Mouse/Touch Drag Rotation State
  const [dragRotation, setDragRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });

  const TOTAL_DURATION = 25; // 25 seconds full cycle

  // Timeline Phase Calculation
  const currentPhase = useMemo(() => {
    if (currentTime < 5)
      return { titleAr: "المرحلة 1: التجميع والتأطير السينمائي", progress: currentTime / 5 };
    if (currentTime < 12)
      return { titleAr: "المرحلة 2: التفكيك الهيكلي الميكانيكي", progress: (currentTime - 5) / 7 };
    if (currentTime < 17)
      return {
        titleAr: "المرحلة 3: المسح الماكرو والدقة الداخلية",
        progress: (currentTime - 12) / 5,
      };
    if (currentTime < 20)
      return {
        titleAr: "المرحلة 4: العرض الكلي المكتمل للأجزاء",
        progress: (currentTime - 17) / 3,
      };
    return { titleAr: "المرحلة 5: إعادة التجميع الموحدة بدقة", progress: (currentTime - 20) / 5 };
  }, [currentTime]);

  // Timer Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.05 * playbackSpeed;
          return next >= TOTAL_DURATION ? 0 : next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Compute Explosion Progress (0 to 1) based on timeline
  const explosionProgress = useMemo(() => {
    const t = currentTime;
    if (t < 5) {
      return (t / 5) * 0.1;
    } else if (t >= 5 && t < 12) {
      const norm = (t - 5) / 7;
      return 0.1 + 0.9 * Math.sin((norm * Math.PI) / 2);
    } else if (t >= 12 && t < 20) {
      return 1;
    } else {
      const norm = (t - 20) / 5;
      return 1 - 0.9 * Math.sin((norm * Math.PI) / 2);
    }
  }, [currentTime]);

  // Final separation factor applied to Z offsets
  const currentSeparation = explosionProgress * explodedFactor;

  // Base 3D Angles
  const baseRotationX = cameraView === "macro" ? 75 : cameraView === "assembled" ? 45 : 62;
  const autoOrbitY = isPlaying ? Math.sin(currentTime * 0.3) * 25 : 0;
  const autoOrbitX = isPlaying ? Math.cos(currentTime * 0.2) * 8 : 0;

  const totalRotateX = baseRotationX + autoOrbitX + dragRotation.x;
  const totalRotateY = autoOrbitY + dragRotation.y;
  const totalRotateZ = cameraView === "macro" ? -15 : 0;

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: dragRotation.x,
      rotY: dragRotation.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setDragRotation({
      x: Math.max(-45, Math.min(45, dragStartRef.current.rotX - deltaY * 0.4)),
      y: dragStartRef.current.rotY + deltaX * 0.5,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const resetRotation = () => {
    setDragRotation({ x: 0, y: 0 });
  };

  return (
    <div
      className={`relative w-full bg-[#05040A] text-white overflow-hidden rounded-[24px] sm:rounded-[32px] border border-white/10 shadow-2xl flex flex-col justify-between select-none ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-none"
          : "max-h-[96vh] overflow-y-auto"
      }`}
      dir="rtl"
    >
      {/* 1. TOP HEADER BAR */}
      <div className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-b from-black/95 via-black/80 to-transparent backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#7B3FFF] to-[#38BDF8] p-[1px] shadow-lg shadow-purple-500/20 shrink-0">
            <div className="w-full h-full bg-[#0B0818] rounded-[15px] flex items-center justify-center">
              <Crosshair
                className="w-4 h-4 sm:w-5 sm:h-5 text-[#38BDF8] animate-spin"
                style={{ animationDuration: "12s" }}
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] sm:text-xs font-bold text-[#38BDF8] tracking-wider uppercase">
                3D HARDWARE DECONSTRUCTION
              </span>
              <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {categoryType === "speaker"
                  ? "مكبر صوت 🔊"
                  : categoryType === "audio"
                    ? "سماعة صوتية 🎧"
                    : categoryType === "perfumes"
                      ? "عطر فاخر 🧪"
                      : categoryType === "smartwatches"
                        ? "ساعة ذكية ⌚"
                        : categoryType === "appliance"
                          ? "جهاز منزلي 🏠"
                          : "جهاز ذكي ⚡"}
              </span>
            </div>
            <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
              {productName}
            </h2>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowWireframe(!showWireframe)}
            className={`px-2.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              showWireframe
                ? "bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]"
                : "bg-white/05 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">الهيكل الزجاجي</span>
          </button>

          <button
            type="button"
            onClick={resetRotation}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold bg-white/05 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
            title="إعادة ضبط زاوية الرؤية"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إعادة التوجيه</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/05 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title={isFullscreen ? "تصغير الشاشة" : "تكبير الشاشة الكاملة"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 flex items-center justify-center transition-all cursor-pointer font-bold text-sm"
              title="إغلاق النافذة"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: UNOBSTRUCTED 3D STAGE & SIDE PANELS */}
      <div className="relative flex-1 w-full flex flex-col lg:flex-row items-center justify-between overflow-hidden">
        {/* CENTER DEDICATED 3D STAGE AREA */}
        <div
          className="relative w-full flex-1 min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ perspective: "1200px" }}
        >
          {/* Studio Lighting Background Environment */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1B1338] via-[#0B0818] to-[#040309]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#7B3FFF]/20 via-[#38BDF8]/10 to-transparent blur-3xl opacity-70" />
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:24px_24px]" />
          </div>

          {/* Floating Phase Badge at Top */}
          <motion.div
            key={currentPhase.titleAr}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full text-center shadow-2xl flex items-center gap-2 pointer-events-none max-w-[90%]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs font-black text-white truncate">
              {currentPhase.titleAr}
            </span>
          </motion.div>

          {/* Drag Angle Helper Indicator */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-6 z-20 text-[10px] font-mono text-white/50 flex items-center gap-1.5 pointer-events-none bg-black/50 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
            <span>المس/اسحب للتدوير 3D</span>
            <span>•</span>
            <span>X:{Math.round(totalRotateX)}°</span>
            <span>Y:{Math.round(totalRotateY)}°</span>
          </div>

          {/* Ground Shadow under Exploded Stack */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
            style={{
              transform: `translate(-50%, -50%) translateY(${140 + currentSeparation * 100}px) rotateX(80deg)`,
              width: `${240 + currentSeparation * 90}px`,
              height: `${130 + currentSeparation * 40}px`,
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 75%)",
              filter: "blur(12px)",
            }}
          />

          {/* Central Exploded Z-Axis Guide Line */}
          {currentSeparation > 0.1 && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 z-0"
              style={{
                transform: `translate(-50%, -50%) rotateX(${totalRotateX}deg) rotateY(${totalRotateY}deg) rotateZ(${totalRotateZ}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="w-0.5 bg-gradient-to-b from-cyan-400/80 via-purple-500/50 to-pink-500/80 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                style={{
                  height: `${380 * currentSeparation}px`,
                  transform: "translateY(-50%)",
                }}
              />
            </div>
          )}

          {/* ==================== MAIN 3D TRANSFORM STAGE ==================== */}
          {/* Responsive scale wrapper to prevent mobile layer clipping */}
          <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
            <div className="relative flex items-center justify-center scale-[0.52] sm:scale-75 md:scale-90 lg:scale-100 max-w-[90vw] transition-transform duration-300 origin-center pointer-events-none">
              <motion.div
                className="relative w-[260px] h-[300px] flex items-center justify-center pointer-events-none"
                animate={{
                  rotateX: totalRotateX,
                  rotateY: totalRotateY,
                  rotateZ: totalRotateZ,
                }}
                transition={{
                  type: "spring",
                  stiffness: isDragging ? 300 : 80,
                  damping: isDragging ? 30 : 20,
                }}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                {/* RENDER DYNAMIC LAYERS IN Z-STACKING ORDER */}
                {layers.map((layer) => {
                  const isSelected = selectedLayer?.id === layer.id;
                  const zDistance = layer.offsetZ * currentSeparation * 1.15;

                  return (
                    <motion.div
                      key={layer.id}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSelectedLayer(layer);
                      }}
                      animate={{
                        transform: `translateZ(${zDistance}px) scale(${isSelected ? 1.08 : 1})`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 120,
                        damping: 18,
                      }}
                      className={`absolute inset-0 m-auto pointer-events-auto cursor-pointer transition-all duration-300 ${
                        showWireframe ? "opacity-80" : ""
                      }`}
                      style={{
                        transformStyle: "preserve-3d",
                        width: "240px",
                        height: "260px",
                      }}
                    >
                      {/* ================= CATEGORY 1: SPEAKER (BLUETOOTH SPEAKER) ================= */}
                      {categoryType === "speaker" && (
                        <div className="w-full h-full flex items-center justify-center">
                          {/* Acoustic Enclosure Cabinet */}
                          {layer.type === "case" && (
                            <div
                              className={`relative w-[230px] h-[230px] mx-auto rounded-[36px] border-4 transition-all duration-300 p-3 flex flex-col justify-between items-center shadow-2xl ${
                                isSelected
                                  ? "border-amber-300 bg-amber-950/80 shadow-[0_0_40px_rgba(245,158,11,0.8)]"
                                  : "border-amber-700/80 bg-gradient-to-br from-amber-950 via-zinc-900 to-black"
                              }`}
                            >
                              <div className="w-full flex justify-between items-center text-[8px] font-mono text-amber-300">
                                <span>WOODEN CABINET</span>
                                <ShieldCheck className="w-4 h-4 text-amber-400" />
                              </div>
                              <div className="text-center my-auto">
                                <span className="text-xs font-black text-amber-100">
                                  ACOUSTIC ENCLOSURE
                                </span>
                                <span className="text-[8px] font-mono text-amber-300 block">
                                  RESONANCE DAMPED
                                </span>
                              </div>
                            </div>
                          )}

                          {/* RGB LED Ring */}
                          {layer.type === "glass" && (
                            <div
                              className={`relative w-[210px] h-[210px] mx-auto rounded-full border-4 transition-all duration-300 p-2 flex items-center justify-center shadow-2xl ${
                                isSelected
                                  ? "border-cyan-300 bg-cyan-400/30 shadow-[0_0_40px_rgba(56,189,248,0.8)]"
                                  : "border-cyan-400/80 bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-cyan-500/20"
                              }`}
                            >
                              <div className="w-[180px] h-[180px] rounded-full border-2 border-dashed border-cyan-300 flex flex-col items-center justify-center text-center">
                                <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse mb-0.5" />
                                <span className="text-[9px] font-black text-cyan-100">
                                  360° RGB LED RING
                                </span>
                                <span className="text-[7px] font-mono text-cyan-200">
                                  MUSIC SYNC
                                </span>
                              </div>
                            </div>
                          )}

                          {/* High Excursion Subwoofer */}
                          {layer.type === "speaker" && (
                            <div
                              className={`relative w-[190px] h-[190px] mx-auto rounded-full border-4 transition-all duration-300 p-3 flex items-center justify-center shadow-2xl ${
                                isSelected
                                  ? "border-red-400 bg-red-950/80 shadow-[0_0_40px_rgba(239,68,68,0.8)]"
                                  : "border-red-500/80 bg-[#0C0A09]"
                              }`}
                            >
                              <div className="w-[160px] h-[160px] rounded-full border-4 border-zinc-800 bg-gradient-to-b from-zinc-900 to-black flex flex-col items-center justify-center text-center">
                                <Volume2 className="w-6 h-6 text-red-400 animate-bounce mb-1" />
                                <span className="text-[10px] font-black text-white">
                                  45W SUBWOOFER
                                </span>
                                <span className="text-[7px] font-mono text-red-300">
                                  N52 NEODYMIUM
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Audio DSP Board */}
                          {layer.type === "motherboard" && (
                            <div
                              className={`relative w-[170px] h-[170px] mx-auto rounded-[28px] border-2 transition-all duration-300 p-2 flex flex-col justify-between items-center shadow-2xl ${
                                isSelected
                                  ? "border-emerald-300 bg-[#064E3B] shadow-[0_0_35px_rgba(16,185,129,0.7)]"
                                  : "border-emerald-500/80 bg-[#02201D]"
                              }`}
                            >
                              <Cpu className="w-5 h-5 text-emerald-400 my-auto" />
                              <span className="text-[9px] font-black text-emerald-300 text-center">
                                DSP & BLUETOOTH 5.3
                              </span>
                            </div>
                          )}

                          {/* 5000mAh Battery */}
                          {layer.type === "battery" && (
                            <div
                              className={`relative w-[150px] h-[150px] mx-auto rounded-[24px] border-2 transition-all duration-300 p-2 flex flex-col justify-center items-center shadow-xl ${
                                isSelected
                                  ? "border-purple-300 bg-purple-950/80 shadow-[0_0_35px_rgba(139,92,246,0.7)]"
                                  : "border-purple-500/80 bg-zinc-900"
                              }`}
                            >
                              <Zap className="w-5 h-5 text-purple-400 mb-1" />
                              <span className="text-xs font-black text-white">5000 mAh</span>
                              <span className="text-[7px] font-mono text-purple-300">
                                POWER BANK OUT
                              </span>
                            </div>
                          )}

                          {/* Passive Bass Radiator */}
                          {layer.type === "gasket" && (
                            <div
                              className={`relative w-[180px] h-[180px] mx-auto rounded-full border-2 transition-all duration-300 p-2 flex items-center justify-center shadow-xl ${
                                isSelected
                                  ? "border-pink-300 bg-pink-950/80 shadow-[0_0_35px_rgba(236,72,153,0.7)]"
                                  : "border-pink-500/70 bg-black"
                              }`}
                            >
                              <div className="w-[150px] h-[150px] rounded-full border-2 border-pink-500/50 flex flex-col items-center justify-center text-center">
                                <Activity className="w-5 h-5 text-pink-400 mb-0.5" />
                                <span className="text-[8px] font-black text-pink-300">
                                  PASSIVE RADIATOR
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Anti-Vibration Feet */}
                          {layer.type === "sensor" && (
                            <div
                              className={`relative w-[210px] h-[65px] mx-auto rounded-2xl border-2 transition-all duration-300 flex items-center justify-center shadow-xl ${
                                isSelected
                                  ? "border-white bg-zinc-800 shadow-[0_0_35px_rgba(255,255,255,0.6)]"
                                  : "border-zinc-500/70 bg-black/90"
                              }`}
                            >
                              <span className="text-[9px] font-black text-zinc-300">
                                ANTI-VIBRATION SILICONE BASE
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ================= CATEGORY 2: AUDIO (EARBUDS) ================= */}
                      {categoryType === "audio" && (
                        <div className="w-full h-full flex items-center justify-center">
                          {/* Silicone Ear Tip */}
                          {layer.type === "silicone" && (
                            <div
                              className={`relative w-[170px] h-[170px] mx-auto rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-lg backdrop-blur-md ${
                                isSelected
                                  ? "border-cyan-300 bg-cyan-400/40 shadow-[0_0_35px_rgba(56,189,248,0.7)] ring-4 ring-cyan-300/30"
                                  : "border-cyan-300/80 bg-gradient-to-tr from-cyan-400/20 via-sky-200/10 to-white/30 shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                              }`}
                            >
                              <div className="w-20 h-20 rounded-full border-2 border-cyan-200/60 bg-black/50 flex flex-col items-center justify-center text-center p-1">
                                <span className="text-[9px] font-black text-cyan-200">
                                  SILICONE TIP
                                </span>
                                <span className="text-[7px] font-mono text-cyan-300">
                                  30dB ISOLATION
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Acoustic Outer Shell */}
                          {layer.type === "case" && (
                            <div
                              className={`relative w-[210px] h-[210px] mx-auto rounded-full border-2 transition-all duration-300 p-2 flex items-center justify-center shadow-xl ${
                                isSelected
                                  ? "border-white bg-zinc-300 shadow-[0_0_35px_rgba(255,255,255,0.6)]"
                                  : "border-zinc-300/80 bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-700"
                              }`}
                            >
                              <div className="w-[185px] h-[185px] rounded-full bg-[#080712] border border-white/20 flex flex-col items-center justify-center text-center p-3">
                                <span className="text-[10px] font-black text-zinc-200">
                                  ACOUSTIC CHAMBER
                                </span>
                                <span className="text-[8px] font-mono text-cyan-400">
                                  POLYCARBONATE SHELL
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 11mm Titanium Dynamic Driver */}
                          {layer.type === "speaker" && (
                            <div
                              className={`relative w-[170px] h-[170px] mx-auto rounded-full border-2 transition-all duration-300 p-2 flex items-center justify-center shadow-xl ${
                                isSelected
                                  ? "border-amber-300 bg-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.7)]"
                                  : "border-amber-400/80 bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-black"
                              }`}
                            >
                              <div className="w-[145px] h-[145px] rounded-full border-4 border-amber-400/80 bg-zinc-950 flex flex-col items-center justify-center text-center">
                                <Volume2 className="w-5 h-5 text-amber-400 mb-0.5 animate-bounce" />
                                <span className="text-[10px] font-black text-amber-300">
                                  11mm TITANIUM
                                </span>
                                <span className="text-[7px] font-mono text-amber-200">
                                  N52 NEODYMIUM
                                </span>
                              </div>
                            </div>
                          )}

                          {/* H2 ANC Audio Board */}
                          {layer.type === "motherboard" && (
                            <div
                              className={`relative w-[150px] h-[150px] mx-auto rounded-full border-2 transition-all duration-300 p-2 flex items-center justify-center shadow-xl ${
                                isSelected
                                  ? "border-emerald-300 bg-emerald-600/40 shadow-[0_0_35px_rgba(16,185,129,0.7)]"
                                  : "border-emerald-400/80 bg-[#02201D]"
                              }`}
                            >
                              <div className="w-[125px] h-[125px] rounded-full border border-emerald-500/50 bg-[#011412] flex flex-col items-center justify-center text-center p-1">
                                <Cpu className="w-5 h-5 text-emerald-400 mb-0.5" />
                                <span className="text-[9px] font-black text-emerald-300">
                                  H2 ANC CHIP
                                </span>
                                <span className="text-[7px] font-mono text-emerald-400">
                                  48kHz AUDIO DSP
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Micro Li-ion Battery */}
                          {layer.type === "battery" && (
                            <div
                              className={`relative w-[130px] h-[130px] mx-auto rounded-full border-2 transition-all duration-300 p-2 flex items-center justify-center shadow-lg ${
                                isSelected
                                  ? "border-red-400 bg-red-600/40 shadow-[0_0_35px_rgba(239,68,68,0.7)]"
                                  : "border-red-500/80 bg-gradient-to-br from-zinc-800 via-red-950 to-zinc-900"
                              }`}
                            >
                              <div className="text-center">
                                <Zap className="w-4 h-4 text-red-400 mx-auto" />
                                <span className="text-[10px] font-black text-white">55 mAh</span>
                                <span className="text-[7px] font-mono text-red-300 block">
                                  3.7V LI-ION
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Dual ANC Mics */}
                          {layer.type === "sensor" && (
                            <div
                              className={`relative w-[160px] h-[160px] mx-auto rounded-full border-2 transition-all duration-300 p-2 flex items-center justify-center shadow-lg ${
                                isSelected
                                  ? "border-purple-300 bg-purple-600/40 shadow-[0_0_35px_rgba(139,92,246,0.7)]"
                                  : "border-purple-400/80 bg-purple-950/50"
                              }`}
                            >
                              <div className="w-full h-full rounded-full border border-purple-400/40 flex items-center justify-around p-3">
                                <Radio className="w-4 h-4 text-purple-300" />
                                <span className="text-[8px] font-black text-purple-200">
                                  DUAL MICS
                                </span>
                                <Radio className="w-4 h-4 text-purple-300" />
                              </div>
                            </div>
                          )}

                          {/* Charging Base */}
                          {layer.type === "gasket" && (
                            <div
                              className={`relative w-[185px] h-[185px] mx-auto rounded-full border-2 transition-all duration-300 p-2 flex items-center justify-center shadow-xl ${
                                isSelected
                                  ? "border-pink-300 bg-pink-600/40 shadow-[0_0_35px_rgba(236,72,153,0.7)]"
                                  : "border-pink-500/70 bg-black"
                              }`}
                            >
                              <div className="w-[155px] h-[155px] rounded-full border-2 border-dashed border-pink-500/50 flex items-center justify-around p-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_8px_#FFB800]" />
                                <span className="text-[8px] font-black text-pink-300">
                                  GOLD CONTACTS
                                </span>
                                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_8px_#FFB800]" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ================= CATEGORY 3: PERFUMES (FLACON) ================= */}
                      {categoryType === "perfumes" && (
                        <div className="w-full h-full flex items-center justify-center">
                          {/* Cap */}
                          {layer.type === "case" && (
                            <div
                              className={`relative w-[130px] h-[75px] mx-auto rounded-t-2xl rounded-b-md border-2 transition-all duration-300 flex flex-col justify-center items-center shadow-xl ${
                                isSelected
                                  ? "border-amber-300 bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600 shadow-[0_0_35px_rgba(245,158,11,0.8)]"
                                  : "border-amber-400/80 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900"
                              }`}
                            >
                              <span className="text-[10px] font-black text-black">
                                24K GOLD CAP
                              </span>
                              <span className="text-[7px] font-mono text-black/80">
                                MAGNETIC LOCK
                              </span>
                            </div>
                          )}

                          {/* Spray Atomizer Pump */}
                          {layer.type === "speaker" && (
                            <div
                              className={`relative w-[100px] h-[65px] mx-auto rounded-xl border-2 transition-all duration-300 flex flex-col justify-center items-center shadow-lg ${
                                isSelected
                                  ? "border-cyan-300 bg-cyan-500/40 shadow-[0_0_30px_rgba(56,189,248,0.7)]"
                                  : "border-amber-400/90 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500"
                              }`}
                            >
                              <Droplet className="w-4 h-4 text-black mb-0.5" />
                              <span className="text-[8px] font-black text-black">
                                ATOMIZER PUMP
                              </span>
                            </div>
                          )}

                          {/* Collar Gasket */}
                          {layer.type === "gasket" && (
                            <div
                              className={`relative w-[140px] h-[45px] mx-auto rounded-xl border-2 transition-all duration-300 flex items-center justify-center shadow-md ${
                                isSelected
                                  ? "border-emerald-300 bg-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.7)]"
                                  : "border-emerald-500/80 bg-emerald-950/80"
                              }`}
                            >
                              <span className="text-[8px] font-bold text-emerald-300">
                                AIRTIGHT SEAL
                              </span>
                            </div>
                          )}

                          {/* Liquid Essence Core */}
                          {layer.type === "liquid" && (
                            <div
                              className={`relative w-[180px] h-[190px] mx-auto rounded-[32px] border-2 transition-all duration-300 p-3 flex flex-col justify-between items-center shadow-2xl overflow-hidden ${
                                isSelected
                                  ? "border-amber-300 bg-gradient-to-b from-amber-500/60 via-amber-600/40 to-yellow-600/70 shadow-[0_0_40px_rgba(245,158,11,0.8)]"
                                  : "border-amber-500/80 bg-gradient-to-b from-amber-500/40 via-amber-700/30 to-yellow-900/50"
                              }`}
                            >
                              <div className="w-full flex justify-between items-center text-[8px] font-mono text-amber-200">
                                <span>PARFUM 30%</span>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                              </div>
                              <div className="text-center my-auto">
                                <Flame className="w-6 h-6 text-amber-300 mx-auto mb-1 animate-pulse" />
                                <span className="text-xs font-black text-white">ESSENCE OIL</span>
                                <span className="text-[8px] font-bold text-amber-200 block">
                                  OUD & MUSK HEART
                                </span>
                              </div>
                              <span className="text-[7px] font-mono text-amber-300">
                                LONGEVITY 24H+
                              </span>
                            </div>
                          )}

                          {/* Crystal Bottle Body */}
                          {layer.type === "glass" && (
                            <div
                              className={`relative w-[210px] h-[230px] mx-auto rounded-[40px] border-2 transition-all duration-300 p-4 flex flex-col justify-between items-center backdrop-blur-md shadow-2xl ${
                                isSelected
                                  ? "border-purple-300 bg-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.7)]"
                                  : "border-purple-400/60 bg-gradient-to-tr from-purple-900/30 via-white/20 to-purple-400/20"
                              }`}
                            >
                              <div className="w-full flex justify-between items-center text-[8px] font-mono text-purple-200">
                                <span>CRYSTAL FLACON</span>
                                <ShieldCheck className="w-4 h-4 text-purple-300" />
                              </div>
                              <div className="text-center">
                                <span className="text-[10px] font-black text-white">
                                  INDEXES BOTTLE
                                </span>
                              </div>
                              <span className="text-[7px] font-mono text-purple-300">
                                HAND-CUT GLASS
                              </span>
                            </div>
                          )}

                          {/* Glass Base */}
                          {layer.type === "sensor" && (
                            <div
                              className={`relative w-[220px] h-[65px] mx-auto rounded-2xl border-2 transition-all duration-300 flex items-center justify-center shadow-xl ${
                                isSelected
                                  ? "border-pink-300 bg-pink-500/40 shadow-[0_0_35px_rgba(236,72,153,0.7)]"
                                  : "border-pink-500/70 bg-black/90"
                              }`}
                            >
                              <span className="text-[9px] font-black text-pink-300">
                                HEAVY GLASS BASE
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ================= CATEGORY 4: SMARTWATCHES ================= */}
                      {categoryType === "smartwatches" && (
                        <div className="w-full h-full flex items-center justify-center">
                          {/* Glass Lens */}
                          {layer.type === "glass" && (
                            <div
                              className={`relative w-[230px] h-[270px] mx-auto rounded-[52px] border-2 transition-all duration-300 flex flex-col justify-between p-4 overflow-hidden backdrop-blur-md ${
                                isSelected
                                  ? "border-[#38BDF8] bg-sky-400/30 shadow-[0_0_40px_rgba(56,189,248,0.7)]"
                                  : "border-cyan-300/60 bg-gradient-to-tr from-cyan-400/20 via-sky-200/10 to-white/40 shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                              }`}
                            >
                              <div className="flex justify-between items-center z-10">
                                <span className="text-[9px] font-black tracking-widest text-cyan-200 uppercase bg-black/40 px-2 py-0.5 rounded-full border border-white/20">
                                  SAPPHIRE 9H
                                </span>
                                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                              </div>
                              <div className="text-center z-10">
                                <div className="w-16 h-1 bg-cyan-200/50 mx-auto rounded-full mb-1" />
                                <span className="text-[10px] font-extrabold text-cyan-100 tracking-wider">
                                  2.5D CURVED GLASS
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Display Matrix */}
                          {layer.type === "display" && (
                            <div
                              className={`relative w-[220px] h-[260px] mx-auto rounded-[48px] border-2 transition-all duration-300 p-3 flex flex-col justify-between overflow-hidden shadow-2xl ${
                                isSelected
                                  ? "border-[#7B3FFF] bg-[#0F0826] shadow-[0_0_35px_rgba(123,63,255,0.7)]"
                                  : "border-purple-500/80 bg-gradient-to-b from-[#120B2E] via-[#0B061E] to-[#1A0B3B]"
                              }`}
                            >
                              <div className="relative w-full h-full rounded-[36px] bg-black border border-white/10 p-2.5 flex flex-col justify-between items-center overflow-hidden">
                                <div className="w-full flex justify-between items-center text-[8px] font-mono text-purple-300">
                                  <span>10:45</span>
                                  <span>100%</span>
                                </div>
                                <div className="text-center my-auto">
                                  <div className="text-2xl font-black text-white">10:45</div>
                                  <div className="text-[9px] font-bold text-cyan-400">
                                    INDEXES ULTRA
                                  </div>
                                </div>
                                <div className="w-full flex justify-between items-center text-[7px] font-bold text-white/70">
                                  <span className="text-rose-400">♥ 72</span>
                                  <span className="text-emerald-400">⚡ 8,420</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Titanium Case */}
                          {layer.type === "case" && (
                            <div
                              className={`relative w-[240px] h-[280px] mx-auto rounded-[56px] border-4 transition-all duration-300 p-2 flex items-center justify-center shadow-2xl ${
                                isSelected
                                  ? "border-cyan-400 bg-zinc-300 shadow-[0_0_40px_rgba(56,189,248,0.6)]"
                                  : "border-zinc-300/90 bg-gradient-to-br from-zinc-400 via-zinc-200 to-zinc-600"
                              }`}
                            >
                              <div className="w-full h-full rounded-[46px] bg-[#090812] border-2 border-zinc-500/50 flex flex-col justify-between p-3 relative">
                                <div className="text-[9px] font-black text-zinc-400 tracking-wider text-center">
                                  TITANIUM GRADE 5
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Gasket */}
                          {layer.type === "gasket" && (
                            <div
                              className={`relative w-[210px] h-[250px] mx-auto rounded-[46px] border-2 transition-all duration-300 p-3 flex flex-col justify-between overflow-hidden shadow-xl ${
                                isSelected
                                  ? "border-amber-400 bg-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                                  : "border-amber-500/70 bg-gradient-to-r from-[#B87333]/90 via-[#D48C46]/80 to-[#8B4513]/90"
                              }`}
                            >
                              <div className="w-full h-full rounded-[38px] border-2 border-dashed border-amber-300/80 p-2 flex flex-col justify-between items-center bg-[#07050E]/80">
                                <span className="text-[8px] font-bold text-amber-300">
                                  IP68 WATERPROOF SEAL
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Motherboard */}
                          {layer.type === "motherboard" && (
                            <div
                              className={`relative w-[200px] h-[240px] mx-auto rounded-[42px] border-2 transition-all duration-300 p-3 flex flex-col justify-between overflow-hidden shadow-2xl ${
                                isSelected
                                  ? "border-emerald-400 bg-[#064E3B] shadow-[0_0_35px_rgba(16,185,129,0.7)]"
                                  : "border-emerald-500/80 bg-[#042F2E]"
                              }`}
                            >
                              <div className="relative w-full h-full rounded-[34px] bg-[#02201D] border border-emerald-500/30 p-2 flex flex-col justify-between items-center">
                                <Cpu className="w-5 h-5 text-emerald-400 my-auto" />
                                <span className="text-[9px] font-black text-emerald-300">
                                  S8 DUAL-CORE
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Battery */}
                          {layer.type === "battery" && (
                            <div
                              className={`relative w-[180px] h-[210px] mx-auto rounded-[36px] border-2 transition-all duration-300 p-3 flex flex-col justify-between overflow-hidden shadow-xl ${
                                isSelected
                                  ? "border-red-400 bg-red-950/80 shadow-[0_0_35px_rgba(239,68,68,0.6)]"
                                  : "border-red-500/70 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900"
                              }`}
                            >
                              <div className="text-center my-auto">
                                <Zap className="w-4 h-4 text-red-400 mx-auto" />
                                <span className="text-sm font-black text-white">450 mAh</span>
                              </div>
                            </div>
                          )}

                          {/* Haptic Speaker */}
                          {layer.type === "speaker" && (
                            <div
                              className={`relative w-[160px] h-[140px] mx-auto rounded-[32px] border-2 transition-all duration-300 p-2 flex flex-col justify-between overflow-hidden shadow-lg ${
                                isSelected
                                  ? "border-purple-400 bg-purple-900/60 shadow-[0_0_30px_rgba(139,92,246,0.6)]"
                                  : "border-purple-500/60 bg-gradient-to-r from-zinc-800 via-purple-950/40 to-zinc-900"
                              }`}
                            >
                              <div className="text-center my-auto">
                                <Activity className="w-4 h-4 text-purple-400 mx-auto" />
                                <span className="text-[9px] font-bold text-purple-200">
                                  TAPTIC ENGINE
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Sensors */}
                          {layer.type === "sensor" && (
                            <div
                              className={`relative w-[230px] h-[270px] mx-auto rounded-[52px] border-2 transition-all duration-300 p-4 flex flex-col justify-between overflow-hidden shadow-2xl ${
                                isSelected
                                  ? "border-pink-400 bg-black shadow-[0_0_40px_rgba(236,72,153,0.7)]"
                                  : "border-pink-500/70 bg-gradient-to-br from-zinc-900 via-black to-zinc-950"
                              }`}
                            >
                              <div className="w-full h-full rounded-[42px] border border-white/10 p-2 flex flex-col justify-between items-center bg-black/90">
                                <Heart className="w-4 h-4 text-pink-500 fill-pink-500 my-auto" />
                                <span className="text-[8px] font-mono text-zinc-400">
                                  ECG & SPO2 SENSORS
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ================= CATEGORY 5: GENERIC FALLBACK / APPLIANCE ================= */}
                      {(categoryType === "generic" || categoryType === "appliance") && (
                        <div className="w-full h-full flex items-center justify-center">
                          {/* Outer Protective Shell */}
                          {layer.type === "glass" && (
                            <div
                              className={`relative w-[220px] h-[250px] mx-auto rounded-[36px] border-2 transition-all duration-300 flex flex-col justify-between p-4 overflow-hidden backdrop-blur-md ${
                                isSelected
                                  ? "border-sky-300 bg-sky-400/30 shadow-[0_0_40px_rgba(56,189,248,0.7)]"
                                  : "border-sky-300/60 bg-gradient-to-tr from-sky-400/20 via-sky-200/10 to-white/30"
                              }`}
                            >
                              <ShieldCheck className="w-5 h-5 text-sky-300 mx-auto" />
                              <span className="text-[9px] font-black text-center text-sky-200 uppercase">
                                PROTECTIVE OUTER SHELL
                              </span>
                            </div>
                          )}

                          {/* Display / Control Panel */}
                          {layer.type === "display" && (
                            <div
                              className={`relative w-[210px] h-[240px] mx-auto rounded-[32px] border-2 transition-all duration-300 p-3 flex flex-col justify-between shadow-2xl ${
                                isSelected
                                  ? "border-purple-300 bg-[#0F0826] shadow-[0_0_35px_rgba(123,63,255,0.7)]"
                                  : "border-purple-500/80 bg-[#120B2E]"
                              }`}
                            >
                              <Sparkles className="w-5 h-5 text-purple-300 mx-auto" />
                              <span className="text-[9px] font-black text-center text-purple-200">
                                DIGITAL CONTROL MATRIX
                              </span>
                            </div>
                          )}

                          {/* Frame Casing */}
                          {layer.type === "case" && (
                            <div
                              className={`relative w-[230px] h-[260px] mx-auto rounded-[40px] border-4 transition-all duration-300 p-2 flex items-center justify-center shadow-2xl ${
                                isSelected
                                  ? "border-zinc-200 bg-zinc-300 shadow-[0_0_40px_rgba(255,255,255,0.6)]"
                                  : "border-zinc-300/90 bg-gradient-to-br from-zinc-400 via-zinc-200 to-zinc-600"
                              }`}
                            >
                              <span className="text-[9px] font-black text-zinc-700">
                                INTERNAL CHASSIS FRAME
                              </span>
                            </div>
                          )}

                          {/* Gasket Heat Sink */}
                          {layer.type === "gasket" && (
                            <div
                              className={`relative w-[200px] h-[230px] mx-auto rounded-[28px] border-2 transition-all duration-300 p-2 flex items-center justify-center shadow-xl ${
                                isSelected
                                  ? "border-amber-300 bg-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.7)]"
                                  : "border-amber-500/70 bg-amber-950/80"
                              }`}
                            >
                              <span className="text-[8px] font-bold text-amber-300">
                                THERMAL COPPER SINK & SEAL
                              </span>
                            </div>
                          )}

                          {/* Motherboard */}
                          {layer.type === "motherboard" && (
                            <div
                              className={`relative w-[190px] h-[220px] mx-auto rounded-[24px] border-2 transition-all duration-300 p-3 flex flex-col justify-between shadow-2xl ${
                                isSelected
                                  ? "border-emerald-300 bg-[#064E3B] shadow-[0_0_35px_rgba(16,185,129,0.7)]"
                                  : "border-emerald-500/80 bg-[#02201D]"
                              }`}
                            >
                              <Cpu className="w-5 h-5 text-emerald-400 mx-auto my-auto" />
                              <span className="text-[9px] font-black text-center text-emerald-300">
                                SMART PCB LOGIC BOARD
                              </span>
                            </div>
                          )}

                          {/* Battery */}
                          {layer.type === "battery" && (
                            <div
                              className={`relative w-[180px] h-[200px] mx-auto rounded-[24px] border-2 transition-all duration-300 p-3 flex flex-col justify-between shadow-xl ${
                                isSelected
                                  ? "border-red-400 bg-red-950/80 shadow-[0_0_35px_rgba(239,68,68,0.7)]"
                                  : "border-red-500/70 bg-zinc-800"
                              }`}
                            >
                              <Zap className="w-5 h-5 text-red-400 mx-auto my-auto" />
                              <span className="text-[9px] font-black text-center text-white">
                                LITHIUM POWER PACK
                              </span>
                            </div>
                          )}

                          {/* Internal Motor or Mechanism */}
                          {layer.type === "speaker" && (
                            <div
                              className={`relative w-[160px] h-[170px] mx-auto rounded-[24px] border-2 transition-all duration-300 p-2 flex flex-col justify-between shadow-lg ${
                                isSelected
                                  ? "border-purple-300 bg-purple-900/60 shadow-[0_0_30px_rgba(139,92,246,0.7)]"
                                  : "border-purple-500/60 bg-zinc-900"
                              }`}
                            >
                              <Settings
                                className="w-5 h-5 text-purple-300 mx-auto my-auto animate-spin"
                                style={{ animationDuration: "10s" }}
                              />
                              <span className="text-[8px] font-black text-center text-purple-200">
                                INTERNAL MECHANISM
                              </span>
                            </div>
                          )}

                          {/* Base */}
                          {layer.type === "sensor" && (
                            <div
                              className={`relative w-[220px] h-[250px] mx-auto rounded-[36px] border-2 transition-all duration-300 p-4 flex flex-col justify-between shadow-2xl ${
                                isSelected
                                  ? "border-pink-300 bg-black shadow-[0_0_40px_rgba(236,72,153,0.7)]"
                                  : "border-pink-500/70 bg-black"
                              }`}
                            >
                              <span className="text-[8px] font-mono text-center text-pink-300 my-auto">
                                REINFORCED CHASSIS BASE
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Floating Selection Callout Label */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -right-20 sm:-right-28 top-1/2 -translate-y-1/2 z-30 bg-[#0B0818]/95 backdrop-blur-xl border border-[#38BDF8] text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl shadow-2xl pointer-events-none whitespace-nowrap flex items-center gap-2 dir-rtl"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: layer.color }}
                          />
                          <span className="text-[11px] sm:text-xs font-black">
                            {layer.nameAr.split("(")[0]}
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>

        {/* DESKTOP SIDEBAR LAYER SELECTOR */}
        <div className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 flex-col gap-1.5 max-h-[380px] overflow-y-auto no-scrollbar p-1">
          {layers.map((layer) => {
            const isSel = selectedLayer?.id === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLayer(layer);
                }}
                className={`px-3 py-1.5 rounded-2xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-2 backdrop-blur-md ${
                  isSel
                    ? "bg-[#7B3FFF] border-[#38BDF8] text-white shadow-lg shadow-purple-500/40 ring-2 ring-[#38BDF8]/50"
                    : "bg-black/60 border-white/10 text-white/70 hover:text-white hover:bg-black/80"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="truncate max-w-[130px]">{layer.nameAr.split("(")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* SELECTED LAYER DETAIL MINI-LABEL OVERLAY */}
        <AnimatePresence>
          {selectedLayer && (
            <motion.div
              key={selectedLayer.id}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="z-40 absolute bottom-3 right-3 sm:right-4 sm:bottom-4 max-w-[280px] p-3 bg-[#0B0818]/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-xl text-right shrink-0 flex flex-col gap-0.5 dir-rtl"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: selectedLayer.color }}
                  />
                  <h3 className="text-sm font-bold text-white truncate">{selectedLayer.nameAr}</h3>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLayer(null);
                  }}
                  className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  aria-label="إغلاق التفاصيل"
                  title="إغلاق تفاصيل الطبقة"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] opacity-60 text-purple-200 font-mono pr-4 truncate">
                {selectedLayer.nameEn}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. MOBILE HORIZONTAL LAYER SELECTOR BAR */}
      <div className="lg:hidden relative z-30 w-full bg-black/90 border-t border-white/10 py-2.5 px-3 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-xs font-bold text-white/90">طبقات المكونات الهيكلية:</span>
          </div>
          <span className="text-[10px] font-mono text-purple-300">اختر طبقة للفحص</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 dir-rtl">
          {layers.map((layer) => {
            const isSel = selectedLayer?.id === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLayer(layer);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 shrink-0 backdrop-blur-md active:scale-95 ${
                  isSel
                    ? "bg-[#7B3FFF] border-[#38BDF8] text-white shadow-lg shadow-purple-500/40 ring-2 ring-[#38BDF8]/50"
                    : "bg-white/05 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="whitespace-nowrap">{layer.nameAr.split("(")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. BOTTOM TIMELINE & CONTROL TOOLBAR */}
      <div className="relative z-30 px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-2xl border-t border-white/10 flex flex-col gap-2.5 shrink-0">
        {/* Scrubber Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px] sm:text-xs font-mono text-white/60">
            <span>00:{(currentTime % 60).toFixed(1).padStart(4, "0")}s</span>
            <span className="text-[#38BDF8] font-bold truncate max-w-[180px] sm:max-w-none">
              {currentPhase.titleAr}
            </span>
            <span>00:25.0s</span>
          </div>

          <div className="relative w-full h-2.5 bg-white/10 rounded-full overflow-hidden cursor-pointer group">
            <div
              className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-[#38BDF8] to-[#7B3FFF] rounded-full transition-all"
              style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max={TOTAL_DURATION}
              step="0.1"
              value={currentTime}
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Play/Pause & Speed */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#7B3FFF] hover:bg-[#6228D7] text-white flex items-center justify-center shadow-lg shadow-purple-500/30 transition-all cursor-pointer active:scale-95 shrink-0"
              title={isPlaying ? "إيقاف مؤقت" : "تشغيل العرض"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTime(0)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white/05 hover:bg-white/10 text-white/80 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="إعادة التشغيل من البداية"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Playback Speed Selector */}
            <div className="flex items-center gap-1 bg-white/05 p-1 rounded-xl border border-white/10 text-[11px] sm:text-xs font-bold">
              {[0.5, 1, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    playbackSpeed === speed
                      ? "bg-[#38BDF8] text-black font-black"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Camera View Angle Presets */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-[11px] sm:text-xs font-bold">
            <button
              type="button"
              onClick={() => setCameraView("orbit")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                cameraView === "orbit"
                  ? "bg-[#7B3FFF] text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              دوران
            </button>

            <button
              type="button"
              onClick={() => setCameraView("exploded")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                cameraView === "exploded"
                  ? "bg-[#7B3FFF] text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              تفصيلي
            </button>

            <button
              type="button"
              onClick={() => setCameraView("macro")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                cameraView === "macro"
                  ? "bg-[#7B3FFF] text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              ماكرو
            </button>
          </div>

          {/* Distance Factor Slider */}
          <div className="flex items-center gap-1.5 bg-white/05 px-2.5 py-1 rounded-xl border border-white/10 text-xs">
            <Sliders className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
            <span className="font-bold text-white/80 text-[11px] hidden sm:inline">المسافة:</span>
            <input
              type="range"
              min="0.2"
              max="1.8"
              step="0.1"
              value={explodedFactor}
              onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
              className="w-16 sm:w-20 accent-[#38BDF8] cursor-pointer"
            />
            <span className="font-mono text-[#38BDF8] text-[11px]">
              {Math.round(explodedFactor * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
