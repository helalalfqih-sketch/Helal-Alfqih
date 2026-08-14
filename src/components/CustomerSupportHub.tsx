import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, Phone, X, Send, Sparkles, 
  Package, ShoppingCart, HelpCircle, Copy, Check, 
  Building2, Box, Info, ArrowLeft, RefreshCw
} from 'lucide-react';
import { STORE_INFO } from '../data/mockData';
import { Product, CartItem, Currency } from '../types';
import { formatPrice } from '../lib/currency';

export type SupportContext = 'home' | 'product' | 'cart' | 'checkout' | 'success' | 'account' | 'unavailable';

interface CustomerSupportHubProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: SupportContext;
  currentProduct?: Product | null;
  cartItems?: CartItem[];
  currency?: Currency;
  lastOrderRef?: string | null;
  onOpenTracker?: () => void;
  onOpenSearch?: () => void;
}

export const CustomerSupportHub: React.FC<CustomerSupportHubProps> = ({
  isOpen,
  onClose,
  activeContext,
  currentProduct,
  cartItems = [],
  currency = 'YER',
  lastOrderRef,
  onOpenTracker,
  onOpenSearch,
}) => {
  const [composerText, setComposerText] = useState('');
  const [activeForm, setActiveForm] = useState<'none' | 'wholesale' | 'special'>('none');
  const [copied, setCopied] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [actionMetrics, setActionMetrics] = useState<Record<string, number>>({});

  const trackActionUsage = (actionId: string, actionLabel: string) => {
    setActionMetrics((prev) => {
      const count = (prev[actionId] || 0) + 1;
      const updated = { ...prev, [actionId]: count };
      console.log(`[SupportHub Analytics] Triggered action "${actionLabel}" (${actionId}) in context "${activeContext}". Total triggers: ${count}`, updated);
      return updated;
    });
  };

  // Form states for Wholesale
  const [wholesaleProduct, setWholesaleProduct] = useState('');
  const [wholesaleQty, setWholesaleQty] = useState('10');
  const [wholesaleName, setWholesaleName] = useState('');
  const [wholesaleNotes, setWholesaleNotes] = useState('');

  // Form states for Special Order
  const [specialDesc, setSpecialDesc] = useState('');
  const [specialLink, setSpecialLink] = useState('');
  const [specialQty, setSpecialQty] = useState('1');

  const rawNumber = STORE_INFO.whatsappNumber || '967771370740';
  const formattedPhone = '+967 771 370 740';

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setActiveForm('none');
      setShowAllActions(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Set default prefilled text when context changes
  useEffect(() => {
    if (currentProduct && (activeContext === 'product' || activeContext === 'unavailable')) {
      setWholesaleProduct(currentProduct.name);
    }
  }, [currentProduct, activeContext]);

  const handleOpenWhatsApp = (customMsg?: string) => {
    const textToSend = customMsg || composerText || 'مرحباً، أود الاستفسار عن خدمات متجر إندكس.';
    const url = `https://wa.me/${rawNumber}?text=${encodeURIComponent(textToSend)}`;
    
    if ('vibrate' in navigator) {
      try { navigator.vibrate(15); } catch (e) {}
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = (text?: string) => {
    const msg = text || composerText;
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWholesaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wholesaleProduct) return;
    const msg = `مرحباً، أريد عرض سعر لكمية تجارية:\nالمنتج: ${wholesaleProduct}\nالكمية المطلوبة: ${wholesaleQty}\nاسم العميل/الشركة: ${wholesaleName || 'غير محدد'}\nملاحظات: ${wholesaleNotes || 'لا يوجد'}`;
    handleOpenWhatsApp(msg);
    setActiveForm('none');
  };

  const handleSpecialOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialDesc) return;
    const msg = `مرحباً، أريد طلب منتج خاص غير مدرج بالمتجر:\nوصف المنتج: ${specialDesc}\nالرابط: ${specialLink || 'لا يوجد'}\nالكمية: ${specialQty}`;
    handleOpenWhatsApp(msg);
    setActiveForm('none');
  };

  // Define Context-Aware Actions
  const getContextActions = () => {
    switch (activeContext) {
      case 'product':
        return [
          {
            id: 'ask_product',
            label: 'اسأل عن هذا المنتج',
            icon: MessageCircle,
            action: () => {
              if (currentProduct) {
                const msg = `مرحباً، أريد الاستفسار عن المنتج:\nالمنتج: ${currentProduct.name}\nالسعر: ${formatPrice(currentProduct.priceYER, currency)}\nأود معرفة تفاصيل إضافية.`;
                setComposerText(msg);
              }
            },
          },
          {
            id: 'check_stock',
            label: 'هل المنتج متوفر للتسليم الفوري؟',
            icon: Package,
            action: () => {
              if (currentProduct) {
                setComposerText(`مرحباً، هل المنتج (${currentProduct.name}) متوفر حالياً للتسليم الفوري في منطقتي؟`);
              }
            },
          },
          {
            id: 'wholesale',
            label: 'طلب كمية تجارية',
            icon: Building2,
            action: () => {
              setWholesaleProduct(currentProduct?.name || '');
              setActiveForm('wholesale');
            },
          },
          {
            id: 'share_support',
            label: 'مشاركة المنتج مع الدعم',
            icon: Sparkles,
            action: () => {
              if (currentProduct) {
                setComposerText(`مرحباً، أود استشارتكم حول المنتج: ${currentProduct.name}`);
              }
            },
          },
        ];

      case 'cart': {
        const subtotal = cartItems.reduce((acc, item) => acc + item.product.priceYER * item.quantity, 0);
        return [
          {
            id: 'cart_help',
            label: 'مساعدة في السلة',
            icon: ShoppingCart,
            action: () => {
              const itemsList = cartItems.map((i) => `- ${i.product.name} (الكمية: ${i.quantity})`).join('\n');
              const msg = `مرحباً، أحتاج مساعدة في السلة الحالية:\n${itemsList}\nالمجموع الظاهر: ${formatPrice(subtotal, currency)}`;
              setComposerText(msg);
            },
          },
          {
            id: 'shipping_inquiry',
            label: 'استفسار عن الشحن والتوصيل',
            icon: Package,
            action: () => {
              setComposerText('مرحباً، أود الاستفسار عن تكاليف ومواعيد الشحن والتوصيل للمحافظات.');
            },
          },
          {
            id: 'coupon_issue',
            label: 'مشكلة في كود الخصم',
            icon: HelpCircle,
            action: () => {
              setComposerText('مرحباً، لدي استفسار أو مشكلة في تطبيق كود الخصم في السلة.');
            },
          },
        ];
      }

      case 'checkout':
        return [
          {
            id: 'checkout_help',
            label: 'مساعدة في بيانات الطلب',
            icon: HelpCircle,
            action: () => {
              setComposerText('مرحباً، أحتاج مساعدة في إدخال بيانات التوصيل أو تحديد المحافظة.');
            },
          },
          {
            id: 'payment_inquiry',
            label: 'استفسار عن طريقة الدفع',
            icon: Info,
            action: () => {
              setComposerText('مرحباً، أود الاستفسار عن طرق الدفع المتاحة (الدفع عند الاستلام / الحوالات).');
            },
          },
          {
            id: 'delivery_inquiry',
            label: 'استفسار عن موعد التوصيل',
            icon: Package,
            action: () => {
              setComposerText('مرحباً، كم يستغرق وصول الطلب إلى منطقتي بعد التأكيد؟');
            },
          },
        ];

      case 'success':
        return [
          {
            id: 'send_order_details',
            label: 'إرسال تفاصيل الطلب عبر واتساب',
            icon: MessageCircle,
            action: () => {
              const refText = lastOrderRef ? ` رقم #${lastOrderRef}` : '';
              setComposerText(`مرحباً، تم إتمام الطلب بنجاح${refText}. أود تأكيد التفاصيل معكم.`);
            },
          },
          {
            id: 'track_order_direct',
            label: 'تتبع الطلب مباشرة',
            icon: Package,
            action: () => {
              onClose();
              if (onOpenTracker) onOpenTracker();
            },
          },
          {
            id: 'report_issue',
            label: 'الإبلاغ عن ملاحظة بالطلب',
            icon: HelpCircle,
            action: () => {
              const refText = lastOrderRef ? ` رقم #${lastOrderRef}` : '';
              setComposerText(`مرحباً، لدي استفسار أو ملاحظة بشأن الطلب${refText}.`);
            },
          },
        ];

      case 'account':
        return [
          {
            id: 'track_order_acc',
            label: 'تتبع شحنة أو طلب سابق',
            icon: Package,
            action: () => {
              onClose();
              if (onOpenTracker) onOpenTracker();
            },
          },
          {
            id: 'warranty',
            label: 'استفسار عن الضمان أو الاستبدال',
            icon: Info,
            action: () => {
              setComposerText('مرحباً، أود الاستفسار عن سياسة الضمان والاستبدال للمنتجات.');
            },
          },
          {
            id: 'general_acc',
            label: 'التواصل المباشر مع الدعم',
            icon: MessageCircle,
            action: () => {
              setComposerText('مرحباً، أحتاج مساعدة عامة بشأن حسابي وطلباتي.');
            },
          },
        ];

      case 'unavailable':
        return [
          {
            id: 'ask_availability',
            label: 'اسأل عن موعد التوفر',
            icon: RefreshCw,
            action: () => {
              if (currentProduct) {
                setComposerText(`مرحباً، متى يتوفر المنتج (${currentProduct.name}) مجدداً في المتجر؟`);
              }
            },
          },
          {
            id: 'special_order',
            label: 'طلب المنتج بشكل خاص',
            icon: Sparkles,
            action: () => {
              setSpecialDesc(currentProduct?.name || '');
              setActiveForm('special');
            },
          },
          {
            id: 'similar_products',
            label: 'البحث عن منتج بديل',
            icon: HelpCircle,
            action: () => {
              onClose();
              if (onOpenSearch) onOpenSearch();
            },
          },
        ];

      default: // Home
        return [
          {
            id: 'general',
            label: 'استفسار عام',
            icon: MessageCircle,
            action: () => {
              setComposerText('مرحباً، أحتاج مساعدة في استكشاف منتجات متجر إندكس.');
            },
          },
          {
            id: 'search_prod',
            label: 'البحث عن منتج محدد',
            icon: HelpCircle,
            action: () => {
              onClose();
              if (onOpenSearch) onOpenSearch();
            },
          },
          {
            id: 'track',
            label: 'تتبع طلب أو شحنة',
            icon: Package,
            action: () => {
              onClose();
              if (onOpenTracker) onOpenTracker();
            },
          },
          {
            id: 'wholesale_home',
            label: 'طلب كمية تجارية / بالجملة',
            icon: Building2,
            action: () => {
              setActiveForm('wholesale');
            },
          },
          {
            id: 'special_home',
            label: 'طلب منتج خاص',
            icon: Box,
            action: () => {
              setActiveForm('special');
            },
          },
        ];
    }
  };

  const actions = getContextActions();
  const visibleActions = showAllActions ? actions : actions.slice(0, 4);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:justify-start bg-black/60 backdrop-blur-sm p-0 sm:p-6 dir-rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-[420px] max-h-[85vh] sm:max-h-[75vh] bg-[#0d091f]/95 border-t sm:border border-emerald-500/30 rounded-t-[28px] sm:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] text-white overflow-hidden flex flex-col sm:ml-6"
        >
          {/* Mobile Drag Handle */}
          <div className="w-12 h-1.5 bg-gray-700/60 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-800/80 flex items-center justify-between shrink-0 bg-[#120c2b]/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>مركز خدمة العملاء</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                    واتساب المباشر
                  </span>
                </h3>
                <p className="text-[11px] text-gray-400">
                  أرسل رسالتك وسيرد فريق الدعم في أقرب وقت
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق مركز الدعم"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 overflow-y-auto space-y-4 no-scrollbar flex-1">
            
            {/* Inline Sub-Forms (Wholesale or Special Order) */}
            {activeForm === 'wholesale' && (
              <form onSubmit={handleWholesaleSubmit} className="bg-[#150f33] border border-blue-500/30 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>طلب كمية تجارية / بالجملة</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveForm('none')}
                    className="text-[10px] text-gray-400 hover:text-white cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">اسم المنتج:</label>
                    <input
                      type="text"
                      required
                      value={wholesaleProduct}
                      onChange={(e) => setWholesaleProduct(e.target.value)}
                      placeholder="أدخل اسم المنتج المطلوب"
                      className="w-full bg-[#0a0718] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 mb-1">الكمية المطلوب:</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={wholesaleQty}
                        onChange={(e) => setWholesaleQty(e.target.value)}
                        className="w-full bg-[#0a0718] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">الاسم / الشركة:</label>
                      <input
                        type="text"
                        value={wholesaleName}
                        onChange={(e) => setWholesaleName(e.target.value)}
                        placeholder="اختياري"
                        className="w-full bg-[#0a0718] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">ملاحظات إضافية:</label>
                    <input
                      type="text"
                      value={wholesaleNotes}
                      onChange={(e) => setWholesaleNotes(e.target.value)}
                      placeholder="أي تفاصيل خاصة بالمواصفات"
                      className="w-full bg-[#0a0718] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال طلب الجملة عبر واتساب</span>
                </button>
              </form>
            )}

            {activeForm === 'special' && (
              <form onSubmit={handleSpecialOrderSubmit} className="bg-[#150f33] border border-amber-500/30 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-amber-400" />
                    <span>طلب منتج خاص غير مدرج</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveForm('none')}
                    className="text-[10px] text-gray-400 hover:text-white cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">وصف المنتج المطلوب:</label>
                    <input
                      type="text"
                      required
                      value={specialDesc}
                      onChange={(e) => setSpecialDesc(e.target.value)}
                      placeholder="وصف أو اسم المنتج غير الموجود"
                      className="w-full bg-[#0a0718] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-gray-400 mb-1">رابط المنتج (إن وجد):</label>
                      <input
                        type="url"
                        value={specialLink}
                        onChange={(e) => setSpecialLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-[#0a0718] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">الكمية:</label>
                      <input
                        type="number"
                        min="1"
                        value={specialQty}
                        onChange={(e) => setSpecialQty(e.target.value)}
                        className="w-full bg-[#0a0718] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الطلب الخاص عبر واتساب</span>
                </button>
              </form>
            )}

            {/* Context-Aware Shortcut Actions */}
            {activeForm === 'none' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-1">
                  <span>خيارات سريعة سياقية:</span>
                  <span className="text-emerald-400 font-bold">
                    {activeContext === 'product' ? 'خيارات المنتج' : 
                     activeContext === 'cart' ? 'خيارات السلة' :
                     activeContext === 'checkout' ? 'خيارات الدفع والتوصيل' :
                     activeContext === 'success' ? 'خيارات إتمام الطلب' : 'خيارات المساعدة'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {visibleActions.map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.id}
                        onClick={() => {
                          trackActionUsage(act.id, act.label);
                          act.action();
                        }}
                        className="w-full text-right bg-[#15102a] hover:bg-emerald-500/15 border border-gray-800 hover:border-emerald-500/50 rounded-xl p-2.5 text-xs text-gray-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{act.label}</span>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-gray-500 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-transform" />
                      </button>
                    );
                  })}
                </div>

                {actions.length > 4 && (
                  <button
                    onClick={() => setShowAllActions(!showAllActions)}
                    className="text-[11px] font-bold text-emerald-400 hover:underline w-full text-center py-1 cursor-pointer"
                  >
                    {showAllActions ? 'عرض أقل' : 'عرض المزيد من الخيارات'}
                  </button>
                )}
              </div>
            )}

            {/* Custom Message Composer */}
            <div className="space-y-2 pt-2 border-t border-gray-800/80">
              <label className="block text-xs font-bold text-gray-300">
                اكتب رسالتك مباشرة:
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="اكتب استفسارك هنا وسنقوم بالرد عليك مباشرة عبر واتساب..."
                  className="w-full bg-[#090615] border border-gray-700/80 focus:border-emerald-500/80 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
                  maxLength={500}
                />
                <span className="absolute bottom-2 left-2 text-[10px] text-gray-500">
                  {composerText.length}/500
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp()}
                  className="flex-1 min-h-[44px] bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>فتح المحادثة في واتساب</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyMessage()}
                  title="نسخ النص"
                  className="min-w-[44px] min-h-[44px] bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl flex items-center justify-center border border-gray-700 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Direct Phone Call Row */}
            <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
              <a
                href={`tel:${rawNumber}`}
                className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>اتصال مباشر: {formattedPhone}</span>
              </a>

              <span className="text-[11px] text-gray-500">
                تُفتح محادثتك مباشرة عبر واتساب
              </span>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
