import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  X,
  UserCheck,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Server,
  Zap,
} from "lucide-react";
import {
  loginAdminWithCredentials,
  sendAdminPasswordReset,
  getRateLimitStatus,
  AdminUser,
} from "../lib/adminAuth";
import { StoreLogo } from "./StoreLogo";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const [activeView, setActiveView] = useState<"login" | "forgot_password">(
    "login",
  );

  // Login Form States
  const [email, setEmail] = useState("helalalfqih@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UI Statuses
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  // Check rate limits on open
  useEffect(() => {
    if (isOpen) {
      const status = getRateLimitStatus();
      if (status.isBlocked) {
        setRateLimitSeconds(status.cooldownSeconds);
      } else {
        setRateLimitSeconds(0);
      }
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  // Rate limit countdown effect
  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitSeconds > 0) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await loginAdminWithCredentials(email, password);
      setIsLoading(false);

      if (res.success && res.user) {
        setSuccessMessage(
          "تم التحقق من الصلاحيات بنجاح! جاري فتح لوحة التحكم...",
        );
        setTimeout(() => {
          onSuccessLogin(res.user!);
          onClose();
        }, 900);
      } else {
        setErrorMessage(
          res.error || "فشل تسجيل الدخول. يرجى التأكد من البيانات.",
        );
        const status = getRateLimitStatus();
        if (status.isBlocked) {
          setRateLimitSeconds(status.cooldownSeconds);
        }
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const errorMessage =
        err instanceof Error ? err.message : String(err || "");
      setErrorMessage("حدث خطأ أثناء الاتصال بخادم المصادقة: " + errorMessage);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const res = await sendAdminPasswordReset(email);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(res.message);
    } else {
      setErrorMessage(res.message);
    }
  };

  const fillMasterCredentials = () => {
    setEmail("helalalfqih@gmail.com");
    setPassword("admin123");
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl transition-all duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-[#0F172A] border border-slate-700/80 rounded-3xl shadow-2xl shadow-blue-900/40 text-slate-100 overflow-hidden"
      >
        {/* Glow Header Accent Background */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all z-10 cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 relative z-10">
          {/* Header Title Section */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center p-3.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl shadow-inner mb-2">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>بوابة إدارة النظام</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PRO AUTH
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              تسجيل دخول آمن مشفر للوصول لمعدات وإعدادات متجر INDEXES Store
            </p>
          </div>

          {/* Master Owner Fast Preset Chip */}
          <div className="mb-6 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  حساب المالك الرئيسي
                </p>
                <p className="text-[11px] text-slate-400">
                  helalalfqih@gmail.com
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fillMasterCredentials}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>تعبئة تلقائية</span>
            </button>
          </div>

          {/* Error Message Alert */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-rose-300 text-xs sm:text-sm leading-relaxed"
              >
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">تنبيه حماية النظام:</p>
                  <p>{errorMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message Alert */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs sm:text-sm"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="font-bold">{successMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main View: Login / Reset */}
          {activeView === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  البريد الإلكتروني للإدارة
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@indexes.store"
                    dir="ltr"
                    className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 rounded-2xl py-3 pr-10 pl-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    كلمة المرور السرية
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveView("forgot_password")}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    dir="ltr"
                    className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 rounded-2xl py-3 pr-10 pl-10 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>حفظ الجلسة آمنة في هذا الجهاز</span>
                </label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Server className="w-3 h-3 text-emerald-400" />
                  <span>تشفير 256-bit</span>
                </span>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: rateLimitSeconds > 0 ? 1 : 1.01 }}
                whileTap={{ scale: rateLimitSeconds > 0 ? 1 : 0.98 }}
                disabled={isLoading || rateLimitSeconds > 0}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer mt-2 ${
                  rateLimitSeconds > 0
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30"
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>جاري التحقق من الصلاحيات...</span>
                  </>
                ) : rateLimitSeconds > 0 ? (
                  <>
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <span>مغلق مؤقتاً ({rateLimitSeconds} ثانية)</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>دخول لوحة التحكم</span>
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            /* Forgot Password Mode */
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  البريد الإلكتروني للمسؤول
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="helalalfqih@gmail.com"
                    dir="ltr"
                    className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 rounded-2xl py-3 pr-10 pl-4 text-sm text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>إرسال رابط الاستعادة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView("login")}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Footer Security Badges */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>نظام حماية المتجر المتكامل v2.6</span>
            </span>
            <span>المالك: helalalfqih@gmail.com</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
