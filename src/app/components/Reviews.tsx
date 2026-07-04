import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { getReviews, addReview, getAverageRating, getRatingDistribution, type Review } from '../utils/reviewStorage';
import { motion, AnimatePresence } from 'motion/react';

type ReviewsProps = {
  productId: number;
};

const ratingLabels: Record<number, { ar: string; fr: string; en: string }> = {
  1: { ar: 'سيء', fr: 'Mauvais', en: 'Poor' },
  2: { ar: 'مقبول', fr: 'Passable', en: 'Fair' },
  3: { ar: 'جيد', fr: 'Bien', en: 'Good' },
  4: { ar: 'جيد جداً', fr: 'Très bien', en: 'Very Good' },
  5: { ar: 'ممتاز', fr: 'Excellent', en: 'Excellent' },
};

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className={`flex gap-1 ${readonly ? '' : 'cursor-pointer'}`} dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={onChange ? 'button' : undefined}
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={(e) => { if (!readonly && onChange) { const stars = e.currentTarget.parentElement?.children; if (stars) for (let i = 0; i < stars.length; i++) stars[i].classList.toggle('text-yellow-400', i < star); } }}
          onMouseLeave={(e) => { if (!readonly && onChange) { const stars = e.currentTarget.parentElement?.children; if (stars) for (let i = 0; i < stars.length; i++) stars[i].classList.toggle('text-yellow-400', i < value); } }}
          className={`transition-all duration-150 ${readonly ? '' : 'hover:scale-110'} ${star <= value ? 'text-yellow-400' : 'text-muted-foreground/30'}`}
          aria-label={`${star} star`}
        >
          <Star className={`w-5 h-5 ${star <= value ? 'fill-yellow-400' : ''}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const { language } = useLanguage();
  const date = new Date(review.date);
  const formatted = date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-base">{review.name}</p>
          <p className="text-xs text-muted-foreground">{formatted}</p>
        </div>
        <StarRating value={review.rating} readonly />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
    </motion.div>
  );
}

export function Reviews({ productId }: ReviewsProps) {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const load = () => {
    setReviews(getReviews(productId));
    setAvgRating(getAverageRating(productId));
    setDistribution(getRatingDistribution(productId));
  };

  useEffect(() => { load(); }, [productId]);

  const totalReviews = reviews.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t({ ar: 'الرجاء إدخال الاسم', fr: 'Veuillez entrer votre nom', en: 'Please enter your name' }));
      return;
    }
    if (rating === 0) {
      toast.error(t({ ar: 'الرجاء اختيار تقييم', fr: 'Veuillez choisir une note', en: 'Please select a rating' }));
      return;
    }
    if (!comment.trim()) {
      toast.error(t({ ar: 'الرجاء كتابة تعليق', fr: 'Veuillez écrire un commentaire', en: 'Please write a comment' }));
      return;
    }

    setSubmitting(true);
    addReview(productId, name.trim(), rating, comment.trim());
    load();
    setName('');
    setRating(0);
    setComment('');
    setSubmitting(false);
    toast.success(t({ ar: 'تم إضافة التقييم بنجاح!', fr: 'Avis ajouté avec succès!', en: 'Review added successfully!' }));
  };

  return (
    <div className="space-y-8">
      {/* Average Rating + Distribution */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center shrink-0">
            <div className="text-5xl font-extrabold text-foreground">{avgRating}</div>
            <div className="flex justify-center mt-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totalReviews === 0
                ? t({ ar: 'لا توجد تقييمات', fr: 'Aucun avis', en: 'No reviews' })
                : `${totalReviews} ${t({ ar: 'تقييم', fr: 'avis', en: 'review' })}${totalReviews > 1 ? (language === 'en' ? 's' : language === 'fr' ? 's' : '') : ''}`}
            </p>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-right font-medium text-muted-foreground">{star}</span>
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review List */}
      <AnimatePresence mode="popLayout">
        {reviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10"
          >
            <Star className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {t({ ar: 'لا توجد تقييمات بعد. كن أول من يقيم!', fr: 'Aucun avis pour le moment. Soyez le premier à donner votre avis!', en: 'No reviews yet. Be the first to review!' })}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Add Review Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 space-y-5">
        <div>
          <h3 className="text-lg font-bold">
            {t({ ar: 'أضف تقييمك', fr: 'Ajouter votre avis', en: 'Add Your Review' })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t({ ar: 'شاركنا رأيك في هذا المنتج', fr: 'Partagez votre expérience avec ce produit', en: 'Share your experience with this product' })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold mb-2">
              {t({ ar: 'الاسم', fr: 'Nom', en: 'Name' })}
              <span className="text-destructive mr-1">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t({ ar: 'أدخل اسمك', fr: 'Entrez votre nom', en: 'Enter your name' })}
              className="w-full rounded-2xl border-2 border-border bg-background px-5 py-3.5 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">
              {t({ ar: 'التقييم', fr: 'Note', en: 'Rating' })}
              <span className="text-destructive mr-1">*</span>
            </label>
            <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-background px-5 py-3.5">
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <span className="text-sm font-medium text-muted-foreground">
                  {ratingLabels[rating as keyof typeof ratingLabels]?.[language]}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            {t({ ar: 'التعليق', fr: 'Commentaire', en: 'Comment' })}
            <span className="text-destructive mr-1">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={t({ ar: 'اكتب تجربتك مع هذا المنتج...', fr: 'Écrivez votre expérience avec ce produit...', en: 'Write about your experience with this product...' })}
            className="w-full resize-none rounded-2xl border-2 border-border bg-background px-5 py-3.5 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-gradient-to-r from-primary to-blue-700 px-8 py-4 text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 btn-liquid disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? t({ ar: 'جاري الإرسال...', fr: 'Envoi en cours...', en: 'Submitting...' })
            : t({ ar: 'إرسال التقييم', fr: 'Envoyer l\'avis', en: 'Submit Review' })}
        </button>
      </form>
    </div>
  );
}
