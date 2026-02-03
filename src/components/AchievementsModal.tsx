import { X, User, Trophy, Flame, Star, Award, Hash, Calendar, Hourglass, Lightbulb, SquareAsterisk, RefreshCw, Plus } from 'lucide-react';
import { getLevelData, getLevelProgress, getNextLevelTarget, getRankMeta } from '../utils/gameUtils';
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

  const levelData = getLevelData(totalScore);
  const currentRankMeta = getRankMeta(levelData.level);

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
        <div className="modal-header-container">
          <div className="modal-header-title-group">
            <User size={28} className="modal-header-icon text-amber-500" />
            <h2 className="modal-header-text">Профиль</h2>
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
                <img src={currentRankMeta.img} alt="rank" className="w-6 h-6" />
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
              <div className="level-progress-fill" style={{ width: `${progress}%` }}></div>
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
              className="profile-btn-primary"
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
                <div className="stat-box p-2">
                   <span className="text-xl">🥇</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{dailyPlaces.first}</span>
                   <span className="stat-label-text">1 место</span>
                </div>
                <div className="stat-box p-2">
                   <span className="text-xl">🥈</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{dailyPlaces.second}</span>
                   <span className="stat-label-text">2 место</span>
                </div>
                <div className="stat-box p-2">
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
                   <span className="text-xs font-bold mb-1 text-blue-600 dark:text-blue-400">7-8 букв</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{rare7_8}</span>
                </div>
                <div className="stat-box p-2">
                   <span className="text-xs font-bold mb-1 text-purple-600 dark:text-purple-400">9-10 букв</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{rare9_10}</span>
                </div>
                <div className="stat-box p-2">
                   <span className="text-xs font-bold mb-1 text-fuchsia-600 dark:text-fuchsia-400">11+ букв</span>
                   <span className="stat-value-text text-sm tracking-tight leading-none">{rare11Plus}</span>
                </div>
             </div>
             
             {/* Список лучших редких слов (Топ-20) */}
             <div className="mt-2">
                <p className="text-[10px] opacity-50 mb-1 pl-1 font-bold uppercase tracking-tight">ТОП-20 находок:</p>
                <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto scrollbar-hide pb-2">
                  {rareWords.sort((a, b) => b.score - a.score).slice(0, 20).map((w, i) => (
                    <div key={i} className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                      w.length >= 11 ? 'bg-fuchsia-100/50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800' :
                      w.length >= 9 ? 'bg-purple-100/50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                      'bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                    }`}>
                      {w.text} <span className="opacity-60 text-[9px] font-black">({w.score})</span>
                    </div>
                  ))}
                  {rareWords.length === 0 && <span className="text-xs opacity-40 italic pl-1">Список пуст... пока что!</span>}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};