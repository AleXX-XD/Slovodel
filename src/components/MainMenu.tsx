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
    <div className="h-[100dvh] w-full max-w-md mx-auto p-4 flex flex-col relative overflow-hidden">

      {/* Модалка достижения */}
      {streakMilestone && (
        <div className="modal-overlay z-[100]">
          <div className="modal-content">
            <div className="text-6xl mb-4 animate-bounce">🔥</div>
            <h2 className="modal-title text-amber-500">Новое достижение!</h2>
            <p className="text-lg font-bold my-4 italic text-gray-800 dark:text-white">"{streakMilestone}"</p>
            <p className="text-sm opacity-70 mb-6 text-gray-600 dark:text-gray-200">Твоя серия: {streak} дн.</p>
            <button onClick={() => { playSfx('click'); setStreakMilestone(null); }} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform uppercase">Продолжить</button>
          </div>
        </div>
      )}

      {/* Верхняя панель (Иконки) */}
      <div className="w-full flex justify-between items-center z-10 shrink-0 gap-2">
        <div className="flex gap-1 shrink-0">
          <button onClick={openGlobalRanking} className={`stat-card text-yellow-400`}>
            <Trophy size={24} />
          </button>
          <div className={`px-2 py-2 rounded-2xl font-bold flex items-center gap-2 shadow-lg stat-card`} title="Ударный режим">
            <span className={`${hasPlayedToday ? "animate-pulse text-red-500" : "opacity-50 grayscale text-gray-500"}`}>
              <Flame size={24} fill={hasPlayedToday ? "currentColor" : "none"} />
            </span>
            <span className={`text-sm ${hasPlayedToday ? "text-red-500" : "opacity-50 text-gray-600 dark:text-gray-300"}`}>{streak}</span>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <button onClick={() => { playSfx('click'); openAchievements(); }} className={`stat-card text-orange-500`}>
            <User size={24} />
          </button>
          <button onClick={() => { playSfx('click'); setShowCollection(true); }} className={`stat-card text-blue-600`}>
            <BookOpenText size={24} />
          </button>
          <button onClick={() => { playSfx('click'); onOpenAbout(); }} className={`stat-card text-cyan-500`}>
            <Info size={24} />
          </button>
          <button onClick={() => setIsMenuOpen(true)} className={`stat-card main_up`}>
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Центральная часть с заголовком */}
      <div className="flex items-center justify-center relative z-0 min-h-0 mt-10 w-full px-8">
        <div className="logo-svg text-gradient-custom drop-shadow-lg"></div>
      </div>

      {/* Нижняя панель */}
      <div className="w-full shrink-0 flex flex-col gap-4 pb-2 mt-auto">
        {/* Блок игрока */}
        <div className="text-center">
          <div className="player-card">
            <p className="text-xs font-bold uppercase tracking-widest text-gradient-custom">{userName}</p>
            <p className="text-[10px] font-bold tracking-widest opacity-60 stat-label">{getUserRank(totalScore)}</p>
          </div>
        </div>

        {/* Карточки статистики */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="stat-card ">
          <div className="stat-label mb-1 uppercase">Ваш рекорд</div>
          <div className="stat-value">{highScore}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label mb-1 uppercase">Всего очков</div>
          <div className="stat-value">{totalScore}</div>
        </div>
      </div>

        {/* Кнопки действий */}
        <div className="space-y-3">
        <button
          onClick={() => { playSfx('click'); openDailyChallenge(); }}
          className={`w-full py-3 font-bold rounded-2xl border transition-all uppercase text-sm flex flex-col items-center justify-center relative overflow-hidden group
            ${isDailyPlayedToday
              //******ИСПРАВИТЬ СТИЛЬ */
              ? 'bg-green-600/10 text-green-600 dark:text-green-400 border-green-500/20'
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
          <button onClick={() => startGame(10)} className="game_easy font-bold">
            Лёгкий <span className="opacity-80 ml-1 normal-case font-medium">( x 1 )</span>
          </button>
          <button onClick={() => startGame(8)} className="game_medium font-bold">
            Средний <span className="opacity-80 ml-1 normal-case font-medium">( x 1.5 )</span>
          </button>
          <button onClick={() => startGame(6)} className="game_hard font-bold">
            Сложный <span className="opacity-80 ml-1 normal-case font-medium">( x 2 )</span>
          </button>
        </div>
        </div>

        <div className="text-center opacity-30 text-[10px] font-bold uppercase tracking-widest text-gray-500">Slovodel • 2026</div>
      </div>
    </div>
  );
};