import { useState } from 'react';
import { getUserRank } from '../utils/gameUtils';

interface ResultsScreenProps {
  score: number;
  lastRoundRecordBeaten: number | null;
  totalScore: number;
  userName: string;
  onMenu: () => void;
  newRankReached: string | null;
}

export const ResultsScreen = ({ score, lastRoundRecordBeaten, totalScore, userName, onMenu, newRankReached }: ResultsScreenProps) => {
  const [showRankModal, setShowRankModal] = useState(!!newRankReached);

  const getProgress = (s: number) => {
    if (s < 2000) return (s / 2000) * 100;
    if (s < 5000) return ((s - 2000) / 3000) * 100;
    if (s < 10000) return ((s - 5000) / 5000) * 100;
    if (s < 50000) return ((s - 10000) / 40000) * 100;
    if (s < 100000) return ((s - 50000) / 50000) * 100;
    if (s < 200000) return ((s - 100000) / 100000) * 100;
    if (s < 500000) return ((s - 200000) / 300000) * 100;
    return 100;
  };

  return (
    <div className="h-full w-full max-w-md mx-auto p-6 flex flex-col items-center justify-center animate-pop relative">
      {/* Модальное окно повышения ранга */}
      {showRankModal && newRankReached && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl border border-white/20 relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <img src="./image/crown.png" alt="Rank Up" className="w-24 h-24 mx-auto mb-4 animate-bounce object-contain" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600 uppercase tracking-tight mb-2">Повышение!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Твои знания растут! Новое звание:</p>
            <div className="py-4 px-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mb-8 border border-indigo-100 dark:border-indigo-500/30">
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-widest">{newRankReached}</p>
            </div>
            <button 
              onClick={() => setShowRankModal(false)}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-wider"
            >
              Отлично!
            </button>
          </div>
        </div>
      )}

      <h2 className="opacity-70 uppercase mb-4 font-bold tracking-[0.2em] text-xs text-gray-600 dark:text-white">Раунд окончен</h2>
      
      <div className="relative">
        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-indigo-600 to-purple-600 dark:from-white dark:to-white/50 mb-4 drop-shadow-lg">{score}</div>
      </div>

      {lastRoundRecordBeaten !== null && (
        <div className="mb-8 text-center animate-bounce">
          <div className="bg-amber-500/20 backdrop-blur-md text-amber-700 dark:text-amber-200 px-6 py-2 rounded-full border border-amber-500/30 shadow-lg">
            <p className="font-black text-sm uppercase tracking-wide">🏆 Новый рекорд!</p>
          </div>
        </div>
      )}

      <div className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40 dark:border-white/20 mb-8">
        <div className="text-[10px] opacity-60 uppercase font-bold text-gray-800 dark:text-white mb-2">Ваш прогресс</div>
        <div className="h-3 w-full bg-gray-200 dark:bg-black/20 rounded-full overflow-hidden mb-3 shadow-inner">
          <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-1000 shadow-[0_0_10px_rgba(167,139,250,0.5)]" style={{ width: `${Math.min(100, getProgress(totalScore))}%` }}></div>
        </div>
        <div className="flex justify-between items-end">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{userName}</p>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-200 uppercase">{getUserRank(totalScore)}</p>
        </div>
      </div>

      <button onClick={onMenu} className="w-full py-4 bg-white/60 dark:bg-white/20 backdrop-blur-md text-indigo-700 dark:text-white font-bold rounded-2xl shadow-lg border border-white/40 dark:border-white/20 active:scale-95 transition-all uppercase tracking-wider hover:bg-white/80 dark:hover:bg-white/30">В меню</button>
    </div>
  );
};