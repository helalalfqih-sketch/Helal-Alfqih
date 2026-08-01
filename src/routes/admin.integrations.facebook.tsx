import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Facebook,
  CheckCircle2,
  Save,
  Loader2,
  AlertTriangle,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getFacebookConfig,
  saveFacebookConfig,
  type FacebookConfig,
} from "@/lib/facebook.functions";

export const Route = createFileRoute("/admin/integrations/facebook" as any)({
  head: () => ({
    meta: [
      { title: "ربط فيسبوك — لوحة الإدارة" },
      { name: "description", content: "ربط متجرك بصفحة فيسبوك لنشر المنتجات تلقائياً." },
    ],
  }),
  component: FacebookIntegrationComponent,
});

function FacebookIntegrationComponent() {
  const queryClient = useQueryClient();
  const fetchConfigFn = useServerFn(getFacebookConfig);
  const saveConfigFn = useServerFn(saveFacebookConfig);

  const [formData, setFormData] = useState<FacebookConfig | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [isFetchingPages, setIsFetchingPages] = useState(false);

  const { data: fbConfig, isLoading } = useQuery({
    queryKey: ["admin-facebook-config"],
    queryFn: () => fetchConfigFn(),
  });

  useEffect(() => {
    if (fbConfig) setFormData(fbConfig);
  }, [fbConfig]);

  const saveMutation = useMutation({
    mutationFn: (data: FacebookConfig) => saveConfigFn({ data }),
    onSuccess: () => {
      toast.success("تم حفظ إعدادات الربط مع فيسبوك بنجاح ✨");
      queryClient.invalidateQueries({ queryKey: ["admin-facebook-config"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل حفظ الإعدادات");
    },
  });

  const handleFetchPages = async () => {
    if (!formData?.userToken) {
      toast.error("يرجى إدخال رمز وصول المستخدم (User Token) أولاً.");
      return;
    }
    setIsFetchingPages(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/v25.0/me/accounts?access_token=${formData.userToken}`,
      );
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || "رمز الوصول غير صالح أو منتهي الصلاحية.");
      }

      if (data.data && data.data.length > 0) {
        setPages(data.data);
        toast.success(`تم جلب ${data.data.length} صفحة بنجاح.`);
      } else {
        toast.warning("لم يتم العثور على أي صفحات تجارية مرتبطة بهذا الحساب.");
        setPages([]);
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء جلب الصفحات.");
    } finally {
      setIsFetchingPages(false);
    }
  };

  const handleSelectPage = (page: any) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pageId: page.id,
        pageName: page.name,
        pageToken: page.access_token,
        status: "active",
      };
    });
    toast.success(`تم اختيار الصفحة: ${page.name}`);
  };

  const handleDisconnect = () => {
    if (window.confirm("هل أنت متأكد من إلغاء الربط بصفحة فيسبوك؟")) {
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pageId: "",
          pageName: "",
          pageToken: "",
          status: "disconnected",
        };
      });
      toast.info("تم إلغاء الربط محلياً، اضغط حفظ لتأكيد التغييرات.");
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
      </div>
    );
  }

  const isConnected = formData.status === "active" && !!formData.pageId;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Facebook className="h-7 w-7 text-[#1877F2]" />
            ربط النشر المباشر مع فيسبوك
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            قم بربط متجرك بصفحة فيسبوك الرسمية لتتمكن من نشر المنتجات بضغطة زر.
          </p>
        </div>

        <button
          onClick={() => saveMutation.mutate(formData)}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-[#1877F2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1877F2]/90 shadow-brand disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          حفظ التغييرات
        </button>
      </div>

      {/* Main Settings Card */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-6 shadow-sm">
        {/* Status Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-[#1877F2]/10">
            <Facebook className="h-6 w-6 text-[#1877F2]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">صفحة فيسبوك للنشر 📢</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected ? `متصل بالصفحة: ${formData.pageName}` : "غير متصل حالياً"}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isConnected
                ? "bg-success/10 text-success border border-success/20"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {isConnected ? "متصل" : "غير متصل"}
          </div>
        </div>

        <div className="h-px w-full bg-border" />

        {/* Token Input */}
        <div>
          <h3 className="text-sm font-bold text-[#1877F2] mb-3">ربط حساب فيسبوك وجلب الصفحات 🔑</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={formData.userToken}
              onChange={(e) => setFormData({ ...formData, userToken: e.target.value })}
              placeholder="EAAAAU..."
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono"
              dir="ltr"
            />
            <button
              onClick={handleFetchPages}
              disabled={isFetchingPages || !formData.userToken}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#1877F2]/30 bg-[#1877F2]/10 px-5 py-2.5 text-sm font-bold text-[#1877F2] hover:bg-[#1877F2]/20 disabled:opacity-50 transition shrink-0"
            >
              {isFetchingPages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              جلب الصفحات
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            أدخل رمز الوصول للمستخدم (User Access Token) المستخرج من Graph API Explorer لجلب صفحاتك.
          </p>
        </div>

        {/* Pages Selector */}
        {pages.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-foreground">اختر الصفحة المراد النشر فيها:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => handleSelectPage(page)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    formData.pageId === page.id
                      ? "border-[#1877F2] bg-[#1877F2]/5 ring-1 ring-[#1877F2]"
                      : "border-border bg-background hover:border-[#1877F2]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{page.name}</span>
                    {formData.pageId === page.id && (
                      <CheckCircle2 className="h-5 w-5 text-[#1877F2]" />
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                    ID: {page.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Info & Disconnect */}
        {isConnected && (
          <>
            <div className="h-px w-full bg-border my-4" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-foreground">معلومات الصفحة المرتبطة:</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  معرف الصفحة: {formData.pageId}
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                إلغاء الربط
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
