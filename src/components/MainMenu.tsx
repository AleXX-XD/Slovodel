import { useState, useEffect } from 'react';
import { getUserRank } from '../utils/gameUtils';
import { Trophy, Flame, BookOpenText, Settings, Zap, Info, CheckCircle } from 'lucide-react';

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
  coins: number;
  onOpenShop: (tab?: 'bonuses' | 'coins') => void;
}

export const MainMenu = ({
 streak, streakMilestone, setStreakMilestone, hasPlayedToday,
  openGlobalRanking, openAchievements, playSfx, setShowCollection, onOpenAbout, setIsMenuOpen,
  userName, totalScore, highScore, isDailyPlayedToday, startGame, openDailyChallenge, dailyScore, challengeEndTime,
  coins, onOpenShop
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
            <h2 className="modal-title text-title-amber">Новое достижение!</h2>
            <p className="text-lg font-bold my-4 italic text-gray-800 dark:text-white break-words px-4">"{streakMilestone}"</p>
            <p className="text-sm opacity-70 mb-6 text-gray-600 dark:text-gray-200">Твоя серия: {streak} дн.</p>
            <button onClick={() => { playSfx('click'); setStreakMilestone(null); }} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform uppercase">Продолжить</button>
          </div>
        </div>
      )}

      {/* Верхняя панель (Иконки) */}
      <div className="w-full flex justify-between items-center z-10 shrink-0 gap-2">
        <div className="flex gap-1 shrink-0">
          <button onClick={openGlobalRanking} className="stat-card-icon stat-card-icon-yellow">
            <Trophy size={24} />
          </button>
          <div className="stat-badge-fire" title="Ударный режим">
            <span className={hasPlayedToday ? "fire-icon-active" : "fire-icon-inactive"}>
              <Flame size={24} fill={hasPlayedToday ? "currentColor" : "none"} />
            </span>
            <span className={`text-sm ${hasPlayedToday ? "fire-text-active" : "fire-text-inactive"}`}>{streak}</span>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <button onClick={() => { playSfx('click'); setShowCollection(true); }} className="stat-card-icon stat-card-icon-blue">
            <BookOpenText size={24} />
          </button>
          <button onClick={() => { playSfx('click'); onOpenAbout(); }} className="stat-card-icon stat-card-icon-cyan">
            <Info size={24} />
          </button>
          <button onClick={() => setIsMenuOpen(true)} className="stat-card-icon main_up">
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
        <div className="flex justify-center items-center gap-3">
          <button onClick={() => { playSfx('click'); openAchievements(); }} className="player-card active:scale-95 transition-transform">
            <p className="text-xs font-bold uppercase tracking-widest text-gradient-custom">{userName}</p>
            <p className="text-[10px] font-bold tracking-widest opacity-60 stat-label">{getUserRank(totalScore)}</p>
          </button>
          
          <button onClick={() => { playSfx('click'); onOpenShop('coins'); }} className="coin-card" title="Магазин">
            <img src="./image/coin.svg" alt="coins" className="w-5 h-5" />
            <span className="coin-value">{coins}</span>
          </button>
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
          className={`game-day-btn group ${isDailyPlayedToday ? 'game-day-end' : 'game-day'}`}
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
          <button onClick={() => startGame(10)} className="game_easy game-difficulty-btn">
            Лёгкий <span className="opacity-80 ml-1 normal-case font-medium">( x 1 )</span>
          </button>
          <button onClick={() => startGame(8)} className="game_medium game-difficulty-btn">
            Средний <span className="opacity-80 ml-1 normal-case font-medium">( x 1.5 )</span>
          </button>
          <button onClick={() => startGame(6)} className="game_hard game-difficulty-btn">
            Сложный <span className="opacity-80 ml-1 normal-case font-medium">( x 2 )</span>
          </button>
        </div>
        </div>

        <div className="settings-footer">Slovodel • 2026</div>
      </div>
    </div>
  );
};