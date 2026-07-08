import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

interface Props {
  endDate: string;
  onEnd?: () => void;
}

export function FlashSaleTimer({ endDate, onEnd }: Props) {
  const { language } = useLanguage();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function calc() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('00:00:00'); onEnd?.(); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endDate, onEnd]);

  return (
    <div className="flex items-center gap-1.5 bg-red-500/15 text-red-400 px-2.5 py-1 rounded-full text-xs font-bold">
      <Sparkles className="w-3 h-3" />
      <span>{timeLeft}</span>
    </div>
  );
}
