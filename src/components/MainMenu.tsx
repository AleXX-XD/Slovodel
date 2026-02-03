import { useState, useEffect } from 'react';
import { getLevelData, getLevelProgress } from '../utils/gameUtils';
import { MODE_MARATHON } from '../utils/constants';
import { Trophy, Flame, Award, Zap, Menu, CheckCircle, Info, X, Clock } from 'lucide-react';

interface MainMenuProps {
  streak: number;
// ... props
  streakMilestone: string | null;
  setStreakMilestone: (val: string | null) => void;
  hasPlayedToday: boolean;
  openGlobalRanking: () => void;
  openAchievements: () => void;
  playSfx: (key: any) => void;
  onOpenMyAchievements: () => void;
  onOpenStreakInfo: () => void;
  onOpenMenu: () => void;
  userName: string;
  avatarUrl?: string;
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
  unclaimedRewardsCount?: number;
}

export const MainMenu = ({
 streak, streakMilestone, setStreakMilestone, hasPlayedToday,
  openGlobalRanking, openAchievements, playSfx, onOpenMyAchievements, onOpenStreakInfo, onOpenMenu,
  userName, avatarUrl, totalScore, isDailyPlayedToday, startGame, openDailyChallenge, dailyScore, challengeEndTime,
  coins, onOpenShop, unclaimedRewardsCount = 0
}: MainMenuProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [infoLevel, setInfoLevel] = useState<number | null>(null);

  const getLevelInfo = (level: number) => {
      switch(level) {
          case 10: return { title: "Лёгкий уровень", desc: "Вам дается 10 букв. Идеально для разминки и поиска длинных слов.", mult: "x 1" };
          case 8: return { title: "Средний уровень", desc: "Вам дается 8 букв. Баланс между сложностью и возможностями.", mult: "x 1.5" };
          case 6: return { title: "Сложный уровень", desc: "Всего 6 букв. Только для настоящих эрудитов!", mult: "x 2" };
          case MODE_MARATHON: return { title: "Словесный Марафон", desc: "Старт с 30 секунд. Каждое слово добавляет время (1 буква = 1 секунда). Каждые 30 секунд игрового времени одна буква на поле меняется.", mult: "x 1 + ⏱️" };
          default: return { title: "", desc: "", mult: "" };
      }
  };

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

      {/* Info Modal */}
      {infoLevel && (
        <div className="modal-overlay z-[110]" onClick={() => setInfoLevel(null)}>
          <div className="modal-content max-w-xs" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-indigo-900 dark:text-white">{getLevelInfo(infoLevel).title}</h3>
              <button onClick={() => setInfoLevel(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed text-sm">
                {getLevelInfo(infoLevel).desc}
            </p>
            <div className="bg-indigo-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                <span className="text-xs uppercase font-bold opacity-60">Множитель очков</span>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{getLevelInfo(infoLevel).mult}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Закрепленная верхняя часть (Header) */}
      <div className="w-full shrink-0 flex flex-col gap-5 z-10 relative mb-4">
        {/* Верхняя панель (Иконки) */}
        <div className="w-full flex justify-between items-center shrink-0 gap-2">
          <div className="flex gap-1 shrink-0">
            <button onClick={openGlobalRanking} className="stat-card-icon stat-card-icon-yellow">
              <Trophy size={24} />
            </button>
            <button 
              onClick={() => { playSfx('click'); onOpenStreakInfo(); }} 
              className="stat-badge-fire" 
              title="Ударный режим"
            >
              <span className={hasPlayedToday ? "fire-icon-active" : "fire-icon-inactive"}>
                <Flame size={24} fill={hasPlayedToday ? "currentColor" : "none"} />
              </span>
              <span className={`text-sm ${hasPlayedToday ? "fire-text-active" : "fire-text-inactive"}`}>{streak}</span>
            </button>
          </div>

          <div className="flex gap-1 shrink-0">
            <button onClick={() => { playSfx('click'); onOpenMyAchievements(); }} className="stat-card-icon stat-card-icon-blue relative" title="Мои достижения">
              <Award size={24} />
              {unclaimedRewardsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              )}
            </button>
            <button onClick={() => { playSfx('click'); onOpenMenu(); }} className="stat-card-icon stat-card-icon-cyan">
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Заголовок */}
        <div className="flex items-center justify-center w-full px-8">
          <div className="logo-svg text-gradient-custom drop-shadow-lg"></div>
        </div>

        {/* Блок профиля (Прогресс + Монеты) */}
        <div className="main-menu-profile-container !mb-0">
          {/* Левая часть: Имя, Ранг, Прогресс */}
          <button 
            onClick={() => { playSfx('click'); openAchievements(); }} 
            className="main-menu-profile-card text-left group"
          >
            {/* Аватар (слева, во всю высоту) */}
            <div className="h-full aspect-square rounded-xl bg-indigo-100 overflow-hidden shrink-0 border border-white/50 shadow-sm relative">
                 {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-300 font-bold text-xl">?</div>
                 )}
            </div>

            {/* Инфо (справа) */}
            <div className="flex flex-col justify-center flex-1 min-w-0 h-full py-0.5">
                <div className="flex flex-col justify-center flex-1 w-full overflow-hidden">
                  <p className="main-menu-profile-name truncate">{userName}</p>
                  <div className="flex justify-between items-end w-full gap-1">
                    <p className="main-menu-profile-rank text-[11px] tracking-tighter shrink-0 mb-0.5">{getLevelData(totalScore).level} уровень</p>
                    <div className="flex flex-col items-end text-right leading-none pb-0.5 min-w-0">
                      <p className="text-[7px] font-bold opacity-60 uppercase tracking-tighter mb-0.5 truncate w-full">Всего очков:</p>
                      <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-300 tracking-tight">{totalScore.toLocaleString('ru-RU')}</p>
                    </div>
                  </div>
                </div>
                
                {/* Шкала прогресса */}
                <div className="main-menu-progress-bg mt-auto">
                  <div 
                    className="level-progress-fill rounded-full" 
                    style={{ width: `${getLevelProgress(totalScore)}%` }}
                  ></div>
                </div>
            </div>
          </button>

          {/* Правая часть: Монеты */}
          <button onClick={() => { playSfx('click'); onOpenShop('coins'); }} className="main-menu-coin-btn gap-2" title="Магазин">
            <img src="./image/coin.svg" alt="coins" className="w-6 h-6 drop-shadow-sm" />
            <span className="text-xs font-black text-amber-500 leading-none">{coins}</span>
          </button>
        </div>
      </div>

      {/* Скроллящаяся нижняя панель */}
      <div className="w-full flex-1 overflow-y-auto min-h-0 flex flex-col pb-2 no-scrollbar">
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
            <div className="relative">
                <button onClick={() => startGame(10)} className="game_easy game-difficulty-btn w-full">
                Лёгкий <span className="opacity-80 ml-1 normal-case font-medium">( x 1 )</span>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); playSfx('click'); setInfoLevel(10); }}
                    className="absolute top-0 right-0 h-full px-4 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                >
                    <Info size={20} />
                </button>
            </div>

            <div className="relative">
                <button onClick={() => startGame(8)} className="game_medium game-difficulty-btn w-full">
                Средний <span className="opacity-80 ml-1 normal-case font-medium">( x 1.5 )</span>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); playSfx('click'); setInfoLevel(8); }}
                    className="absolute top-0 right-0 h-full px-4 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                >
                    <Info size={20} />
                </button>
            </div>

            <div className="relative">
                <button onClick={() => startGame(6)} className="game_hard game-difficulty-btn w-full">
                Сложный <span className="opacity-80 ml-1 normal-case font-medium">( x 2 )</span>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); playSfx('click'); setInfoLevel(6); }}
                    className="absolute top-0 right-0 h-full px-4 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                >
                    <Info size={20} />
                </button>
            </div>

            <div className="relative">
                      <button onClick={() => startGame(MODE_MARATHON)} className="game_marathon game-difficulty-btn w-full flex flex-row items-center justify-center gap-2">
                        <span className="whitespace-nowrap">Словесный Марафон</span> 
                        <span className="opacity-80 normal-case font-medium flex items-center gap-1 whitespace-nowrap shrink-0">
                            ( x 1 + <Clock size={14} /> )
                        </span>
                      </button>                <button 
                    onClick={(e) => { e.stopPropagation(); playSfx('click'); setInfoLevel(MODE_MARATHON); }}
                    className="absolute top-0 right-0 h-full px-4 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                >
                    <Info size={20} />
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Футер закреплен внизу */}
      <div className="settings-footer opacity-40 text-center text-[10px] uppercase font-bold tracking-tighter py-2 shrink-0">
        SLOwODEL • 2026
      </div>
    </div>
  );
};
