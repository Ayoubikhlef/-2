import { useState, useEffect } from 'react';
import { Gift, Star, TrendingUp, Shield, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getLoyalty, addPoints, redeemPoints, type LoyaltyRecord } from '../utils/loyaltyStorage';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const POINTS_PER_DZD = 100;

function getPointsNeeded(points: number): number {
  if (points < 100) return 100 - points;
  const next = Math.ceil(points / 100) * 100;
  return next - points;
}

export function LoyaltyCard({ phone, name, amount }: { phone: string; name: string; amount?: number }) {
  const { t, language } = useLanguage();
  const [record, setRecord] = useState<LoyaltyRecord | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState(100);

  useEffect(() => {
    setRecord(getLoyalty(phone));
  }, [phone]);

  useEffect(() => {
    if (amount && amount > 0) {
      const updated = addPoints(phone, name, amount);
      setRecord(updated);
      const points = Math.floor(amount / POINTS_PER_DZD);
      if (points > 0) {
        toast.success(
          t({
            ar: `تمت إضافة ${points} نقطة ولاء!`,
            fr: `${points} points de fidélité ajoutés !`,
            en: `${points} loyalty points added!`,
          })
        );
      }
      setRecord(getLoyalty(phone));
    }
  }, [amount, phone, name, t]);

  const handleRedeem = () => {
    if (!record) return;
    if (redeemAmount > record.points) {
      toast.error(
        t({
          ar: 'نقاط غير كافية',
          fr: 'Points insuffisants',
          en: 'Insufficient points',
        })
      );
      return;
    }
    setRedeeming(true);
    const result = redeemPoints(phone, redeemAmount);
    setRedeeming(false);
    if (result.success) {
      toast.success(
        t({
          ar: `تم استبدال ${redeemAmount} نقطة بخصم ${result.discount} د.ج`,
          fr: `${redeemAmount} points échangés contre ${result.discount} DZD de réduction`,
          en: `${redeemAmount} points redeemed for ${result.discount} DZD discount`,
        })
      );
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
      setRecord(getLoyalty(phone));
    } else {
      toast.error(
        t({
          ar: 'فشل الاستبدال',
          fr: 'Échange échoué',
          en: 'Redemption failed',
        })
      );
    }
  };

  const pointsNeeded = record ? getPointsNeeded(record.points) : 100;
  const progressPercent = record ? Math.min((record.points % 100) / 100, 1) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg">
          <Gift className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            {t({ ar: 'برنامج الولاء', fr: 'Programme de fidélité', en: 'Loyalty Program' })}
          </h3>
          <p className="text-sm text-slate-400">{name}</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Star className="h-3.5 w-3.5 text-yellow-400" />
            {t({ ar: 'النقاط', fr: 'Points', en: 'Points' })}
          </div>
          <p className="text-2xl font-bold text-white">{record?.points ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            {t({ ar: 'المجموع', fr: 'Total dépensé', en: 'Total spent' })}
          </div>
          <p className="text-2xl font-bold text-white">
            {(record?.totalSpent ?? 0).toLocaleString()} <span className="text-sm font-normal text-slate-400">د.ج</span>
          </p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
          <span>
            {t({ ar: 'النقاط المتبقية للهدية القادمة', fr: 'Points pour la prochaine récompense', en: 'Points to next reward' })}
          </span>
          <span className="font-semibold text-yellow-400">{pointsNeeded}</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {t({
            ar: 'كل 100 د.ج = نقطة واحدة | 100 نقطة = 100 د.ج خصم',
            fr: '100 DZD = 1 point | 100 points = 100 DZD de réduction',
            en: '100 DZD = 1 point | 100 points = 100 DZD discount',
          })}
        </p>
      </div>

      {record && record.points >= 100 && (
        <div className="rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-300">
              {t({ ar: 'استبدال النقاط', fr: 'Échanger des points', en: 'Redeem points' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(Number(e.target.value))}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {Array.from({ length: Math.floor((record?.points ?? 0) / 100) }, (_, i) => (i + 1) * 100).map((val) => (
                <option key={val} value={val} className="bg-slate-800 text-white">
                  {val} {t({ ar: 'نقطة', fr: 'pts', en: 'pts' })} = {val} د.ج
                </option>
              ))}
            </select>
            <button
              onClick={handleRedeem}
              disabled={redeeming}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white hover:from-yellow-400 hover:to-orange-500 disabled:opacity-50 transition-all"
            >
              <Shield className="h-4 w-4" />
              {redeeming
                ? t({ ar: 'جاري...', fr: 'En cours...', en: 'Redeeming...' })
                : t({ ar: 'استبدال', fr: 'Échanger', en: 'Redeem' })}
            </button>
          </div>
        </div>
      )}

      {(!record || record.points < 100) && (
        <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-sm text-slate-400">
          <Shield className="h-4 w-4 text-slate-500" />
          {t({
            ar: 'اجمع 100 نقطة لتفعيل الاستبدال',
            fr: 'Collectionnez 100 points pour activer l\'échange',
            en: 'Collect 100 points to enable redemption',
          })}
        </div>
      )}
    </motion.div>
  );
}
