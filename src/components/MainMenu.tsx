import { useState, useEffect } from 'react';
import { getUserRank } from '../utils/gameUtils';
import { Trophy, Flame, BookOpenText, Settings, Zap, User, Info, CheckCircle } from 'lucide-react';

interface MainMenuProps {
  streak: number;
  streakMilestone: string | null;
  setStreakMilestone: (val: string | null) => void;
  hasPlayedToday: boolean;
  openGlobalRanking: () => void;
  openAchievements: () => void;
  playSfx: (key: any) => void;
  setShowCollection: (val: boolean) => void;
  onOpenAbout: () => void;
  setIsMenuOpen: (val: boolean) => void;
  userName: string;
  totalScore: number;
  highScore: number;
  isDailyPlayedToday: boolean;
  startGame: (level: number, daily?: boolean) => void;
  openDailyChallenge: () => void;
  dailyScore: number;
  challengeId: string;
  challengeEndTime?: string | null;
}

export const MainMenu = ({
  streak, streakMilestone, setStreakMilestone, hasPlayedToday,
  openGlobalRanking, openAchievements, playSfx, setShowCollection, onOpenAbout, setIsMenuOpen,
  userName, totalScore, highScore, isDailyPlayedToday, startGame, openDailyChallenge, dailyScore, challengeEndTime
}: MainMenuProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      if (!challengeEndTime) {
        setTimeLeft("...");
        return;
      }
      const now = Date.now();
      const diff = new Date(challengeEndTime).getTime() - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [challengeEndTime]);

  return (
    <div className="h-full w-full max-w-md mx-auto p-6 flex flex-col justify-center relative overflow-hidden">




      {/* Модалка достижения */}
      {streakMilestone && (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center animate-pop shadow-2xl border border-white/20">
            <div className="text-6xl mb-4 animate-bounce">🔥</div>
            <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tight">Новое достижение!</h2>
            <p className="text-lg font-bold my-4 italic text-gray-800 dark:text-white">"{streakMilestone}"</p>
            <p className="text-sm opacity-70 mb-6 text-gray-600 dark:text-gray-200">Твоя серия: {streak} дн.</p>
            <button onClick={() => { playSfx('click'); setStreakMilestone(null); }} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform uppercase">Продолжить</button>
          </div>
        </div>
      )}

      {/* Верхняя панель */}
      <div className="absolute top-4 left-0 w-full px-4 flex justify-between z-10 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={openGlobalRanking} className="p-2 bg-white/60 dark:bg-white/20 backdrop-blur-md rounded-2xl font-bold transition-all border border-white/40 dark:border-white/20 hover:bg-white/80 dark:hover:bg-white/30 active:scale-95 shadow-lg text-amber-600 dark:text-amber-300"><Trophy size={24} /></button>
          <div className="px-3 py-2 bg-white/60 dark:bg-white/20 backdrop-blur-md rounded-2xl font-black flex items-center gap-2 border border-white/40 dark:border-white/20 shadow-lg" title="Ударный режим">
            <span className={`${hasPlayedToday ? "animate-pulse text-orange-500" : "opacity-50 grayscale text-gray-500"}`}><Flame size={24} fill={hasPlayedToday ? "currentColor" : "none"} /></span>
            <span className={`text-sm ${hasPlayedToday ? "text-amber-600 dark:text-amber-300" : "opacity-50 text-gray-600 dark:text-gray-300"}`}>{streak}</span>
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => { playSfx('click'); openAchievements(); }} className="p-2 bg-white/60 dark:bg-white/20 backdrop-blur-md rounded-2xl font-bold transition-all border border-white/40 dark:border-white/20 hover:bg-white/80 dark:hover:bg-white/30 active:scale-95 shadow-lg text-amber-500 dark:text-amber-400"><User size={24} /></button>
          <button onClick={() => { playSfx('click'); setShowCollection(true); }} className="p-2 bg-white/60 dark:bg-white/20 backdrop-blur-md rounded-2xl font-bold transition-all border border-white/40 dark:border-white/20 hover:bg-white/80 dark:hover:bg-white/30 active:scale-95 shadow-lg text-indigo-600 dark:text-indigo-200"><BookOpenText size={24} /></button>
          <button onClick={() => { playSfx('click'); onOpenAbout(); }} className="p-2 bg-white/60 dark:bg-white/20 backdrop-blur-md rounded-2xl font-bold transition-all border border-white/40 dark:border-white/20 hover:bg-white/80 dark:hover:bg-white/30 active:scale-95 shadow-lg text-blue-500 dark:text-blue-300"><Info size={24} /></button>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-white/60 dark:bg-white/20 backdrop-blur-md rounded-2xl font-bold transition-all border border-white/40 dark:border-white/20 hover:bg-white/80 dark:hover:bg-white/30 active:scale-95 shadow-lg text-gray-600 dark:text-gray-200"><Settings size={24} /></button>
        </div>
      </div>

      {/* Заголовок */}
      <div className="text-center mb-6 mt-16 relative z-0">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-indigo-600 to-purple-600 dark:from-white dark:to-white/60 tracking-tighter drop-shadow-lg">СЛОВОДЕЛ</h1>
        <div className="mt-2 inline-block px-6 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-full border border-white/40 dark:border-white/20 shadow-lg">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-200">{userName}</p>
          <p className="text-[10px] font-bold opacity-60 text-indigo-500 dark:text-indigo-100">{getUserRank(totalScore)}</p>
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-2 gap-3 mb-6 text-center">
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/40 dark:border-white/10">
          <div className="text-[10px] opacity-60 uppercase font-bold mb-1 text-indigo-800 dark:text-indigo-100">Ваш рекорд</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white drop-shadow-md">{highScore}</div>
        </div>
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/40 dark:border-white/10">
          <div className="text-[10px] opacity-60 uppercase font-bold mb-1 text-indigo-800 dark:text-indigo-100">Всего очков</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white drop-shadow-md">{totalScore}</div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="space-y-3">
        <button
          onClick={() => { playSfx('click'); openDailyChallenge(); }}
          className={`w-full py-3 font-bold rounded-2xl border transition-all uppercase text-sm flex flex-col items-center justify-center relative overflow-hidden group
            ${isDailyPlayedToday
              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
              : 'bg-gradient-to-r from-amber-400/80 to-orange-500/80 backdrop-blur-md text-white border-white/20 shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]'}`}
        >
          {isDailyPlayedToday ? (
             <span className="text-lg relative z-10 flex items-center gap-2"><CheckCircle size={20} /> Рейтинг дня</span>
          ) : (
             <span className="text-lg relative z-10 flex items-center gap-2"><Zap size={20} fill="currentColor" /> Испытание дня</span>
          )}
          
          {isDailyPlayedToday ? (
            <span className="text-[10px] lowercase normal-case mt-1 opacity-70">
              Вы набрали: {dailyScore} очков • Следующее через: {timeLeft}
            </span>
          ) : (
            <span className="text-[10px] lowercase normal-case mt-1 opacity-90">
              До конца: {timeLeft}
            </span>
          )}
        </button>

        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => startGame(10)} className="w-full py-4 bg-white/60 dark:bg-white/10 backdrop-blur-sm text-green-600 dark:text-green-300 font-black rounded-2xl border border-green-500/20 dark:border-green-400/30 shadow-lg active:scale-[0.98] transition-all uppercase text-sm hover:bg-green-500/10 dark:hover:bg-green-400/20">
            Лёгкий <span className="opacity-60 text-[10px] ml-1">x1</span>
          </button>
          <button onClick={() => startGame(8)} className="w-full py-4 bg-white/60 dark:bg-white/10 backdrop-blur-sm text-blue-600 dark:text-blue-300 font-black rounded-2xl border border-blue-500/20 dark:border-blue-400/30 shadow-lg active:scale-[0.98] transition-all uppercase text-sm hover:bg-blue-500/10 dark:hover:bg-blue-400/20">
            Средний <span className="opacity-60 text-[10px] ml-1">x1.5</span>
          </button>
          <button onClick={() => startGame(6)} className="w-full py-4 bg-white/60 dark:bg-white/10 backdrop-blur-sm text-red-600 dark:text-red-300 font-black rounded-2xl border border-red-500/20 dark:border-red-400/30 shadow-lg active:scale-[0.98] transition-all uppercase text-sm hover:bg-red-500/10 dark:hover:bg-red-400/20">
            Сложный <span className="opacity-60 text-[10px] ml-1">x2</span>
          </button>
        </div>
      </div>

      <div className="mt-4 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest text-gray-500">v1.3 • Slovodel</div>
    </div>
  );
};