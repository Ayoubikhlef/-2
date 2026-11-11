import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  fetchAllReviewsAdmin,
  setReviewApproved,
  deleteReview,
  getReviewProductMap,
  type Review,
} from '../utils/reviewStorage';
import { Star, Trash2, Package, CheckCircle, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Filter = 'pending' | 'approved' | 'all';

export function ReviewsTab() {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAllReviewsAdmin();
      setReviews(list);
      setProductMap(getReviewProductMap());
    } catch {
      toast.error(t({ ar: 'تعذّر تحميل التقييمات', fr: 'Impossible de charger les avis', en: 'Failed to load reviews' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleApprove = async (review: Review, approved: boolean) => {
    setBusyId(review.id);
    try {
      await setReviewApproved(review.id, approved);
      setReviews((current) => current.map((item) => (item.id === review.id ? { ...item, approved } : item)));
      toast.success(approved
        ? t({ ar: 'تم نشر التقييم', fr: 'Avis publié', en: 'Review published' })
        : t({ ar: 'تم إخفاء التقييم', fr: 'Avis masqué', en: 'Review hidden' }));
    } catch {
      toast.error(t({ ar: 'تعذّر تحديث التقييم', fr: "Impossible de mettre à jour l'avis", en: 'Failed to update review' }));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t({ ar: 'تأكيد حذف التقييم؟', fr: 'Confirmer la suppression?', en: 'Confirm delete?' }))) return;
    setBusyId(id);
    try {
      await deleteReview(id);
      setReviews((current) => current.filter((item) => item.id !== id));
      toast.success(t({ ar: 'تم حذف التقييم', fr: 'Avis supprimé', en: 'Review deleted' }));
    } catch {
      toast.error(t({ ar: 'تعذّر حذف التقييم', fr: "Impossible de supprimer l'avis", en: 'Failed to delete review' }));
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const pendingCount = reviews.filter((review) => review.approved === false).length;
  const approvedCount = reviews.filter((review) => review.approved === true).length;
  const filtered = reviews.filter((review) => {
    if (filter === 'pending') return review.approved === false;
    if (filter === 'approved') return review.approved === true;
    return true;
  });

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'pending', label: t({ ar: 'بانتظار المراجعة', fr: 'En attente', en: 'Pending' }), count: pendingCount },
    { id: 'approved', label: t({ ar: 'منشورة', fr: 'Publiés', en: 'Published' }), count: approvedCount },
    { id: 'all', label: t({ ar: 'الكل', fr: 'Tous', en: 'All' }), count: reviews.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg font-bold text-white">
          {t({ ar: 'تقييمات المنتجات', fr: 'Avis produits', en: 'Product Reviews' })} ({reviews.length})
        </h3>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === item.id
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-white/10 bg-slate-900/60 text-white/60 hover:text-white'
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {loading && reviews.length === 0 ? (
        <div className="space-y-3">
          {[1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-slate-900/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">
            {filter === 'pending'
              ? t({ ar: 'لا توجد تقييمات بانتظار المراجعة', fr: 'Aucun avis en attente', en: 'No pending reviews' })
              : t({ ar: 'لا توجد تقييمات بعد', fr: 'Aucun avis pour le moment', en: 'No reviews yet' })}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div key={review.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="font-bold text-white">{review.name}</span>
                    <span className="text-xs text-white/40">{formatDate(review.date)}</span>
                    {productMap[String(review.productId)] && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Package className="w-3 h-3" /> {productMap[String(review.productId)]}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      review.approved
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {review.approved
                        ? t({ ar: 'منشور', fr: 'Publié', en: 'Published' })
                        : t({ ar: 'قيد المراجعة', fr: 'En attente', en: 'Pending' })}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mb-2" dir="ltr">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-white/70">{review.comment}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => void handleApprove(review, !review.approved)}
                    disabled={busyId === review.id}
                    title={review.approved
                      ? t({ ar: 'إخفاء التقييم', fr: "Masquer l'avis", en: 'Hide review' })
                      : t({ ar: 'نشر التقييم', fr: "Publier l'avis", en: 'Publish review' })}
                    className={`p-2 rounded-lg transition-all disabled:opacity-40 ${
                      review.approved
                        ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                        : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                    }`}
                  >
                    {review.approved ? <EyeOff className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => void handleDelete(review.id)}
                    disabled={busyId === review.id}
                    title={t({ ar: 'حذف التقييم', fr: "Supprimer l'avis", en: 'Delete review' })}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
