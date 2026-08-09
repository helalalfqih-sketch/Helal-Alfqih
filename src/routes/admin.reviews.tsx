import { createFileRoute } from "@tanstack/react-router";
import {
  Star,
  Check,
  X,
  Trash2,
  Loader2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTenantReviews, moderateReview, deleteReview, type ReviewRow } from "@/lib/reviews.functions";
import { useStoreContext } from "@/components/store/store-shell";

export const Route = createFileRoute("/admin/reviews")({
  component: ReviewsPage,
});

const STATUS_LABELS: Record<ReviewRow["status"], string> = {
  pending: "بانتظار المراجعة",
  approved: "موافق عليه",
  rejected: "مرفوض",
};

const STATUS_COLORS: Record<ReviewRow["status"], string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

function ReviewsPage() {
  const { can } = useStoreContext();
  const fetchReviews = useServerFn(listTenantReviews);
  const modReviewFn = useServerFn(moderateReview);
  const delReviewFn = useServerFn(deleteReview);

  const { data: reviews = [], refetch, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: () => fetchReviews(),
  });

  const [filter, setFilter] = useState<"all" | ReviewRow["status"]>("all");

  const filtered =
    filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  const modMut = useMutation({
    mutationFn: (args: { id: string; status: "approved" | "rejected" }) => modReviewFn({ data: args }),
    onSuccess: (r, args) => {
      if (r.success) {
        toast.success(args.status === "approved" ? "تمت الموافقة على التقييم" : "تم رفض التقييم");
        refetch();
      } else {
        toast.error(r.message ?? "فشل التحديث");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delReviewFn({ data: { id } }),
    onSuccess: (r) => {
      if (r.success) {
        toast.success("تم حذف التقييم");
        refetch();
      } else {
        toast.error(r.message ?? "فشل الحذف");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = reviews.filter((r) => r.status === "pending").length;
  const approved = reviews.filter((r) => r.status === "approved").length;

  if (!can("staff")) {
    return (
      <div className="rounded-2xl glass p-10 text-center text-sm text-muted-foreground">
        هذه الصفحة متاحة لفريق العمل فقط.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" />
            التقييمات والمراجعات
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pending} بانتظار المراجعة · {approved} معتمد
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-center">
          <div className="text-2xl font-black text-warning">{pending}</div>
          <div className="text-xs text-muted-foreground">بانتظار المراجعة</div>
        </div>
        <div className="rounded-2xl border border-success/30 bg-success/5 p-4 text-center">
          <div className="text-2xl font-black text-success">{approved}</div>
          <div className="text-xs text-muted-foreground">معتمدة</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <div className="text-2xl font-black">{reviews.length}</div>
          <div className="text-xs text-muted-foreground">إجمالي التقييمات</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 rounded-xl border border-border bg-surface p-1 w-fit">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "الكل" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center text-muted-foreground">
            <MessageSquare className="mx-auto h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">لا توجد تقييمات في هذه الفئة</p>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border bg-surface p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold">{r.customer_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {r.product_name}
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                         key={i}
                         className={`h-3.5 w-3.5 ${
                          i < r.rating
                            ? "fill-warning stroke-warning"
                            : "stroke-muted-foreground fill-none"
                         }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("ar-YE")}
                </div>
              </div>

              <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                {r.comment}
              </p>

              <div className="flex items-center gap-2">
                {r.status !== "approved" && (
                  <button
                    onClick={() => modMut.mutate({ id: r.id, status: "approved" })}
                    disabled={modMut.isPending || !can("manager")}
                    className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-bold text-success hover:bg-success/20 transition disabled:opacity-50"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    موافقة
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => modMut.mutate({ id: r.id, status: "rejected" })}
                    disabled={modMut.isPending || !can("manager")}
                    className="flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning hover:bg-warning/20 transition disabled:opacity-50"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    رفض
                  </button>
                )}
                <button
                  onClick={() => delMut.mutate(r.id)}
                  disabled={delMut.isPending || !can("manager")}
                  className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
