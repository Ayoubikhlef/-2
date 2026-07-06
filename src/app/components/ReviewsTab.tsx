import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllReviewsAdmin, deleteReview, getReviewProductMap, loadReviewsFromServer, type Review } from '../utils/reviewStorage';
import { Star, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

export function ReviewsTab() {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productMap, setProductMap] = useState<Record<string, string>>({});

  const load = () => {
    setReviews(getAllReviewsAdmin());
    setProductMap(getReviewProductMap());
  };

  useEffect(() => {
    loadReviewsFromServer().then(() => load());
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm(t({ ar: 'تأكيد حذف التقييم؟', fr: 'Confirmer la suppression?', en: 'Confirm delete?' }))) return;
    deleteReview(id);
    load();
    toast.success(t({ ar: 'تم حذف التقييم', fr: 'Avis supprimé', en: 'Review deleted' }));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          {t({ ar: 'تقييمات المنتجات', fr: 'Avis produits', en: 'Product Reviews' })} ({reviews.length})
        </h3>
        <button onClick={load} className="text-sm text-primary font-semibold hover:underline">
          {t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">{t({ ar: 'لا توجد تقييمات بعد', fr: 'Aucun avis pour le moment', en: 'No reviews yet' })}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="font-bold text-white">{review.name}</span>
                    <span className="text-xs text-white/40">{formatDate(review.date)}</span>
                    {productMap[review.productId] && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Package className="w-3 h-3" /> {productMap[review.productId]}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-0.5 mb-2" dir="ltr">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-white/70">{review.comment}</p>
                </div>
                <button onClick={() => handleDelete(review.id)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
