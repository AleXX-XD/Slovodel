import { X, User, Trophy, Flame, Star, Award, Hash, Calendar, Hourglass, Lightbulb, SquareAsterisk, RefreshCw, Plus } from 'lucide-react';
import { getLevelProgress, getNextLevelTarget } from '../utils/gameUtils';
import type { RareWord } from './CollectionModal';

interface AchievementsModalProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
  username: string;
  avatarUrl?: string;
  rank: string;
  totalScore: number;
  highScore: number;
  streak: number;
  totalWords: number;
  rareWords: RareWord[];
  bonuses: { time: number; hint: number; swap: number; wildcard: number };
  onOpenShop: (tab?: 'bonuses' | 'coins') => void;
  place: number;
  daysPlayed: number;
  dailyPlaces: { first: number; second: number; third: number };
  coins: number;
  isPublicView?: boolean;
}

export const AchievementsModal = ({
  onClose, playSfx, username, avatarUrl, rank,
  totalScore, highScore, streak, totalWords, rareWords, bonuses, onOpenShop,
  place, daysPlayed, dailyPlaces, coins, isPublicView = false
}: AchievementsModalProps) => {

  const getRankImage = (r: string) => {
    if (r.includes("Новичок")) return "./image/face.png";
    if (r.includes("Книжный")) return "./image/worm.png";
    if (r.includes("Следопыт")) return "./image/ranger.png";
    if (r.includes("Скаут")) return "./image/scaut.png";
    if (r.includes("Адепт")) return "./image/adept.png";
    if (r.includes("Мастер")) return "./image/master.png";
    if (r.includes("Магистр")) return "./image/wizard.png";
    if (r.includes("Живая")) return "./image/book_master.png";
    if (r.includes("Оракул")) return "./image/oracul.png";
    return "./image/face.png";
  };

  const progress = getLevelProgress(totalScore);
  const nextTarget = getNextLevelTarget(totalScore);

  // Подсчет редких слов по категориям
  const rare7_8 = rareWords.filter(w => w.length >= 7 && w.length <= 8).length;
  const rare9_10 = rareWords.filter(w => w.length >= 9 && w.length <= 10).length;
  const rare11Plus = rareWords.filter(w => w.length >= 11).length;

  return (
    <div className="modal-overlay z-[900] text-left">
      <div className="modal-content max-w-sm text-left flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <User size={28} className="modal-header-icon text-amber-500" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Профиль</h2>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
            <X size={24} className="modal-icon" />
          </button>
        </div>

        {/* Content */}
        <div className="about-scroll-container space-y-6">

          {/* Player Profile */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <img src={avatarUrl || './image/book_face.png'} alt="avatar" className="profile-avatar" />
              <div className="profile-rank-badge">
                <img src={getRankImage(rank)} alt="rank" className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="profile-name">{username}</h3>
              <p className="profile-rank">{rank}</p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="profile-block">
            <div className="flex justify-between profile-label">
              <span>Прогресс уровня</span>
              {nextTarget && <span>{totalScore} / {nextTarget}</span>}
            </div>
            <div className="level-progress-bg">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

         {/* Balance */}
         {!isPublicView && (
           <div className="profile-block cursor-pointer active:scale-95 transition-transform" onClick={() => { playSfx('click'); onOpenShop('coins'); }}>
            <div className="flex justify-between items-center">
              <span className="profile-label mb-0">Ваш баланс:</span>
              <div className="flex items-center gap-2">
                <img src="./image/coin.svg" alt="coin" className="w-6 h-6 object-contain" />
                <span className="shop-balance-value">{coins}</span>
              </div>
            </div>
           </div>
         )}

          {/* Bonuses Section */}
          {!isPublicView && (
          <div className="space-y-3">
            <h3 className="profile-label">Ваши бонусы:</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: <Hourglass size={20} className="text-indigo-500" />, count: bonuses.time },
                { icon: <Lightbulb size={20} className="text-amber-500" />, count: bonuses.hint },
                { icon: <SquareAsterisk size={20} className="text-purple-500" />, count: bonuses.wildcard },
                { icon: <RefreshCw size={20} className="text-pink-500" />, count: bonuses.swap }
              ].map((b, i) => (
                <div key={i} className="bonus-card">
                  <div className="mb-1">{b.icon}</div>
                  <span className="bonus-count-badge font-bold text-sm">{b.count}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { playSfx('click'); onOpenShop(); }}
              className="w-full py-3 bg-violet-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all uppercase text-sm flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Получить бонусы
            </button>
          </div>
          )}

          {/* Раздел 1: Общая статистика */}
          <div className="space-y-2">
             <h3 className="profile-label">Общая статистика</h3>
             <div className="grid grid-cols-3 gap-2">
                <div className="stat-box p-2">
                   <Award className="w-5 h-5 text-indigo-500 mb-1" />
                   <span className="stat-value-text text-sm tracking-tight leading-none">{totalScore.toLocaleString()}</span>
                   <span className="stat-label-text">Очки</span>
                </div>
                <div className="stat-box p-2">
                   <Star className="w-5 h-5 text-rose-500 mb-1" />
                   <span className="stat-value-text text-sm tracking-tight leading-none">{highScore.toLocaleString()}</span>
                   <span className="stat-label-text">Рекорд</span>
                </div>
                <div className="stat-box p-2">
                   <Trophy className="w-5 h-5 text-amber-500 mb-1" />
                   <span className="stat-value-text text-sm tracking-tight leading-none">{place > 0 ? place : '-'}</span>
                   <span className="stat-label-text">В рейтинге</span>
                </div>
             </div>
          </div>

          {/* Раздел 2: Дневные испытания */}
          <div className="space-y-2">
             <h3 className="profile-label">Дневные испытания</h3>
             <div className="grid grid-cols-3 gap-2">
                <div className="stat-box p-2 bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/30">
                   <span className="text-xl">🥇</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{dailyPlaces.first}</span>
                   <span className="stat-label-text">1 место</span>
                </div>
                <div className="stat-box p-2 bg-gray-100/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-600/30">
                   <span className="text-xl">🥈</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{dailyPlaces.second}</span>
                   <span className="stat-label-text">2 место</span>
                </div>
                <div className="stat-box p-2 bg-orange-100/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/30">
                   <span className="text-xl">🥉</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{dailyPlaces.third}</span>
                   <span className="stat-label-text">3 место</span>
                </div>
             </div>
          </div>

          {/* Раздел 3: Активность */}
          <div className="space-y-2">
             <h3 className="profile-label">Активность</h3>
             <div className="grid grid-cols-3 gap-2">
                <div className="stat-box p-2">
                   <Calendar className="w-5 h-5 text-blue-500 mb-1" />
                   <span className="stat-value-text text-sm tracking-tight leading-none">{daysPlayed}</span>
                   <span className="stat-label-text">Дней</span>
                </div>
                <div className="stat-box p-2">
                   <Flame className="w-5 h-5 text-orange-500 mb-1" />
                   <span className="stat-value-text text-sm tracking-tight leading-none">{streak}</span>
                   <span className="stat-label-text">Серия</span>
                </div>
                <div className="stat-box p-2">
                   <Hash className="w-5 h-5 text-green-500 mb-1" />
                   <span className="stat-value-text text-sm tracking-tight leading-none">{totalWords.toLocaleString()}</span>
                   <span className="stat-label-text">Всего слов</span>
                </div>
             </div>
          </div>

          {/* Раздел 4: Редкие слова */}
          <div className="space-y-2 mb-1">
             <h3 className="profile-label">Редкие слова</h3>
             <div className="grid grid-cols-3 gap-2">
                <div className="stat-box p-2">
                   <span className="text-xs font-bold mb-1 text-indigo-500">7-8 букв</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{rare7_8}</span>
                </div>
                <div className="stat-box p-2">
                   <span className="text-xs font-bold mb-1 text-purple-500">9-10 букв</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{rare9_10}</span>
                </div>
                <div className="stat-box p-2">
                   <span className="text-xs font-bold mb-1 text-pink-500">11+ букв</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{rare11Plus}</span>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};