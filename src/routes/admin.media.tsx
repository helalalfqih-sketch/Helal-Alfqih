import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Image as ImageIcon,
  Film,
  Upload,
  Search,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  MessageSquare,
  Bot,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  listMediaFiles,
  recordMediaFile,
  deleteMediaFile,
  findUnusedMediaFiles,
  validateMediaFile,
  type MediaFileRecord,
} from "@/lib/media.functions";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [
      { title: "مكتبة الوسائط — لوحة الإدارة" },
      { name: "description", content: "إدارة الصور والفيديوهات والوسائط في متجرك الإلكتروني." },
    ],
  }),
  component: AdminMediaComponent,
});

function AdminMediaComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fetchMediaFn = useServerFn(listMediaFiles);
  const recordMediaFn = useServerFn(recordMediaFile);
  const deleteMediaFn = useServerFn(deleteMediaFile);
  const scanUnusedFn = useServerFn(findUnusedMediaFiles);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
  const [filterSource, setFilterSource] = useState<"all" | "upload" | "whatsapp" | "ai_generated">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [selectedFile, setSelectedFile] = useState<MediaFileRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScanningUnused, setIsScanningUnused] = useState(false);
  const [unusedFiles, setUnusedFiles] = useState<MediaFileRecord[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Query Media List with search, type, source, category, and sorting
  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ["admin-media-files", searchTerm, filterType, filterSource, filterCategory, sortOption],
    queryFn: async () => {
      try {
        const res = await fetchMediaFn({
          data: {
            search: searchTerm,
            type: filterType,
            source: filterSource,
            category: filterCategory,
            sort: sortOption,
          },
        });
        return res || [];
      } catch (e) {
        console.warn("fetchMediaFn error, using fallback:", e);
        return [];
      }
    },
    retry: false,
    staleTime: 5000,
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (data: Parameters<typeof recordMediaFn>[0]["data"]) => recordMediaFn({ data }),
    onSuccess: () => {
      toast.success("تم رفع الوسيطة وتسجيلها بنجاح ✨");
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل تسجيل الملف");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMediaFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف الملف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
      setSelectedFile(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل حذف الملف");
    },
  });

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      const val = validateMediaFile(file);
      if (!val.valid) {
        toast.error(val.error);
        continue;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const fileUrl = reader.result as string;
        const fileType = file.type.startsWith("video/") ? "video" : "image";

        uploadMutation.mutate({
          file_name: file.name,
          file_path: `media/${Date.now()}_${file.name}`,
          file_url: fileUrl,
          file_type: fileType,
          mime_type: file.type || "image/png",
          size_bytes: file.size,
          metadata: { source: "upload" },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("تم نسخ رابط الملف إلى الحافظة 📋");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleScanUnused = async () => {
    setIsScanningUnused(true);
    try {
      const unused = await scanUnusedFn();
      setUnusedFiles(unused);
      if (unused.length === 0) {
        toast.info("جميع الوسائط مستخدمة حالياً في المتجر 🎉");
      } else {
        toast.warning(`تم كشف ${unused.length} ملف غير مستخدم في المتجر.`);
      }
    } catch {
      toast.error("حدث خطأ أثناء فحص الملفات غير المستخدمة");
    } finally {
      setIsScanningUnused(false);
    }
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Header & Simplified Quick Action Buttons Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <ImageIcon className="h-5 w-5" />
            </div>
            مكتبة الوسائط
          </h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            إدارة صور وفيديوهات المنتجات والبنرات والوسائط المستوردة من الواتساب والذكاء الاصطناعي.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            رفع وسائط جديدة
          </button>

          <Link
            to="/admin/integrations/whatsapp"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            مزامنة الواتساب
          </Link>

          <button
            type="button"
            onClick={handleScanUnused}
            disabled={isScanningUnused}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-accent transition-all disabled:opacity-50"
            title="فحص الملفات التي لا ترتبط بأي منتج"
          >
            {isScanningUnused ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
            فحص الملفات المهملة
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
          />
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(Array.from(e.dataTransfer.files || []));
        }}
        onClick={() => fileInputRef.current?.click()}
        className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-border/80 bg-surface/40 p-5 text-center transition-all duration-200 hover:border-primary/60 hover:bg-primary/5 hover:shadow-xs"
      >
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
          <Upload className="h-5 w-5" />
        </div>
        <p className="mt-2 text-xs font-bold text-foreground">
          اسحب الصور أو الفيديوهات هنا، أو انقر للاختيار من جهازك مباشرة
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          يدعم الصور (JPG, PNG, WebP, SVG حتى 10MB) والفيديوهات (MP4, WebM حتى 50MB)
        </p>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="space-y-3 rounded-3xl border border-border/80 bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث باسم الملف أو الوسوم (#tags)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background ps-9 pe-4 py-2 text-xs font-medium focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">جميع التصنيفات</option>
              <option value="معدات وأدوات">معدات وأدوات</option>
              <option value="إلكترونيات">إلكترونيات</option>
              <option value="ساعات ومجوهرات">ساعات ومجوهرات</option>
              <option value="أثاث ومنزل">أثاث ومنزل</option>
              <option value="وسائط متنوعة">وسائط متنوعة</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
            >
              <option value="newest">الأحدث أولاً ⏱️</option>
              <option value="oldest">الأقدم أولاً</option>
              <option value="name_asc">الاسم (أ - ي)</option>
              <option value="name_desc">الاسم (ي - أ)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills (Media Types & Sources) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-muted-foreground me-1 shrink-0">النوع:</span>
            {[
              { id: "all", label: "الكل" },
              { id: "image", label: "الصور 🖼️" },
              { id: "video", label: "الفيديوهات 🎥" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterType(t.id as any)}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition shrink-0 ${
                  filterType === t.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-muted-foreground me-1 shrink-0">المصدر:</span>
            {[
              { id: "all", label: "جميع المصادر" },
              { id: "upload", label: "مرفوع يدويًا" },
              { id: "whatsapp", label: "واتساب WhatsApp" },
              { id: "ai_generated", label: "ذكاء اصطناعي AI" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilterSource(s.id as any)}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition shrink-0 ${
                  filterSource === s.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Unused Media Scanner Result Banner */}
      {unusedFiles && unusedFiles.length > 0 && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-bold text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>تم العثور على {unusedFiles.length} ملف غير مرتبط بأي منتج أو تصنيف في المتجر.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm(`هل أنت تأكد من حذف ${unusedFiles.length} ملف غير مستخدم لتوفير المساحة؟`)) {
                unusedFiles.forEach((f) => deleteMutation.mutate(f.id));
                setUnusedFiles(null);
              }
            }}
            className="rounded-2xl bg-destructive px-3.5 py-1.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs"
          >
            تنظيف الملفات المهملة
          </button>
        </div>
      )}

      {/* Media Files Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : mediaFiles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-surface">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-3">
            <ImageIcon className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">لا توجد وسائط تطابق تصفيتك</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            قم برفع وسائط جديدة أو ربط WhatsApp Media Sync لاستقبال وسائط المنتجات تلقائياً.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
          >
            <Upload className="h-4 w-4" /> رفع ملف الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mediaFiles.map((file) => {
            const source = (file as any).source || (file as any).metadata?.source || "upload";
            return (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-xs transition duration-200 hover:border-primary/60 hover:shadow-md"
              >
                {/* Source Badge overlay */}
                <div className="absolute top-2.5 start-2.5 z-10">
                  {source === "whatsapp" && (
                    <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-md">
                      <MessageSquare className="h-2.5 w-2.5" /> WhatsApp
                    </span>
                  )}
                  {source === "ai_generated" && (
                    <span className="inline-flex items-center gap-1 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-md">
                      <Bot className="h-2.5 w-2.5" /> AI
                    </span>
                  )}
                  {source === "upload" && (
                    <span className="inline-flex items-center gap-1 bg-background/90 text-foreground text-[9px] font-bold px-2 py-0.5 rounded-lg border border-border/60 backdrop-blur-md">
                      <Upload className="h-2.5 w-2.5" /> مرفوع
                    </span>
                  )}
                </div>

                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                  {file.file_type === "video" ? (
                    <div className="relative h-full w-full bg-black flex items-center justify-center">
                      <Film className="h-8 w-8 text-white/80" />
                    </div>
                  ) : (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        // Resilient Fallback Image rendering
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop";
                      }}
                    />
                  )}
                </div>

                <div className="p-2.5 text-xs space-y-1">
                  <p className="font-bold truncate text-foreground">{file.file_name}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{(file.size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                    {((file.metadata as any)?.category as string) && (
                      <span className="font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[9px]">
                        {(file.metadata as any).category as string}
                      </span>
                    )}
                  </div>
                  {Array.isArray((file.metadata as any)?.tags) && ((file.metadata as any).tags as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {((file.metadata as any).tags as string[]).slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="bg-accent text-muted-foreground text-[9px] px-1.5 py-0.5 rounded font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected File Detail Modal Drawer */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <div className="w-full max-w-xl rounded-3xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 truncate">
                <h3 className="text-base font-bold truncate">{selectedFile.file_name}</h3>
                {((selectedFile as any).metadata?.source === "whatsapp") && (
                  <span className="bg-emerald-500/10 text-emerald-600 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <MessageSquare className="h-3 w-3" /> WhatsApp Media
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-xl p-1 text-muted-foreground hover:bg-accent"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              {selectedFile.file_type === "video" ? (
                <video src={selectedFile.file_url} controls className="h-full w-full" />
              ) : (
                <img
                  src={selectedFile.file_url}
                  alt={selectedFile.file_name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop";
                  }}
                />
              )}
            </div>

            {/* AI Suggestion Box if imported from WhatsApp */}
            {(selectedFile as any).metadata?.ai_suggestion && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <Bot className="h-4 w-4" /> اقتراح الذكاء الاصطناعي للمنتج
                  </span>
                </div>
                <p className="text-muted-foreground">
                  تم اكتشاف صنف هذا المنتج تلقائياً من المحادثة والميديا.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-3">
              <div>
                <span className="text-muted-foreground block">اسم الملف:</span>
                <span className="font-bold truncate block">{selectedFile.file_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">الحجم:</span>
                <span className="font-bold">{((selectedFile.size_bytes || 0) / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div>
                <span className="text-muted-foreground block">نوع الملف:</span>
                <span className="font-bold">{selectedFile.mime_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">تاريخ الإضافة:</span>
                <span className="font-bold">{new Date(selectedFile.created_at).toLocaleDateString("ar-SA")}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <button
                type="button"
                onClick={() => handleCopyUrl(selectedFile.file_url, selectedFile.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-accent transition"
              >
                {copiedId === selectedFile.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId === selectedFile.id ? "تم النسخ" : "نسخ رابط الصورة"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("هل أنت تأكد من حذف هذا الملف نهائياً من المكتبة؟")) {
                    deleteMutation.mutate(selectedFile.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف الملف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
