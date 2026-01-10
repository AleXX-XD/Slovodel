import { X, User, Trophy, Flame, Star, Hash, Calendar, Hourglass, Lightbulb, SquareAsterisk, RefreshCw, Plus } from 'lucide-react';
import { getLevelProgress, getNextLevelTarget } from '../utils/gameUtils';

interface AchievementsModalProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
  username: string;
  avatarUrl?: string;
  rank: string;
  totalScore: number;
  highScore: number;
  streak: number;
  dailyWins: number;
  totalWords: number;
  rareWordsCount: number;
  bonuses: { time: number; hint: number; swap: number; wildcard: number };
  onOpenShop: () => void;
}

export const AchievementsModal = ({
  onClose, playSfx, username, avatarUrl, rank,
  totalScore, highScore, streak, dailyWins, totalWords, rareWordsCount, bonuses, onOpenShop
}: AchievementsModalProps) => {

  const getRankImage = (r: string) => {
    if (r.includes("Новичок")) return "./image/face.png";
    if (r.includes("Книжный") || r.includes("Следопыт")) return "./image/worm_1.png";
    if (r.includes("Скаут") || r.includes("Мастер")) return "./image/wizard.png";
    return "./image/book_master_1.png";
  };

  const progress = getLevelProgress(totalScore);
  const nextTarget = getNextLevelTarget(totalScore);

  return (
    <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-pop border border-white/20 h-[85vh] relative">
        
        {/* Header */}
        <div className="bg-white/50 dark:bg-white/5 p-6 text-gray-900 dark:text-white shrink-0 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <User className="w-8 h-8 text-amber-500" />
              Профиль
            </h2>
            <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Player Profile */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <img src={avatarUrl || './image/book_face_1.png'} alt="avatar" className="w-24 h-24 rounded-full border-4 border-white/20 shadow-xl" />
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-white/10">
                <img src={getRankImage(rank)} alt="rank" className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{username}</h3>
              <p className="text-sm font-bold text-indigo-500 dark:text-indigo-300 uppercase tracking-widest">{rank}</p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between text-xs font-bold uppercase mb-2 opacity-70 text-gray-800 dark:text-white">
              <span>Прогресс уровня</span>
              {nextTarget && <span>{totalScore} / {nextTarget}</span>}
            </div>
            <div className="h-4 w-full bg-gray-200 dark:bg-black/30 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {/* Bonuses Section */}
          <div className="space-y-3">
            <h3 className="font-black opacity-60 uppercase text-xs text-gray-800 dark:text-white">Ваши подсказки:</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: <Hourglass size={20} className="text-indigo-500" />, count: bonuses.time },
                { icon: <Lightbulb size={20} className="text-amber-500" />, count: bonuses.hint },
                { icon: <SquareAsterisk size={20} className="text-purple-500" />, count: bonuses.wildcard },
                { icon: <RefreshCw size={20} className="text-pink-500" />, count: bonuses.swap }
              ].map((b, i) => (
                <div key={i} className="bg-white/60 dark:bg-white/10 p-3 rounded-xl flex flex-col items-center justify-center border border-white/20 shadow-sm">
                  <div className="mb-1">{b.icon}</div>
                  <span className="font-black text-gray-800 dark:text-white">{b.count}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => { playSfx('click'); onOpenShop(); }}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all uppercase text-sm flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Получить подсказки
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Trophy className="w-6 h-6 text-amber-500" />, val: highScore, label: "Рекорд" },
              { icon: <Star className="w-6 h-6 text-indigo-500" />, val: totalScore, label: "Всего очков" },
              { icon: <Flame className="w-6 h-6 text-orange-500" />, val: streak, label: "Серия дней" },
              { icon: <Calendar className="w-6 h-6 text-green-500" />, val: dailyWins, label: "Побед дня" },
              { icon: <Hash className="w-6 h-6 text-blue-500" />, val: totalWords, label: "Слов найдено" },
              { icon: <img src="./image/book.png" className="w-6 h-6" alt="book" />, val: rareWordsCount, label: "Редких слов" },
            ].map((stat, i) => (
              <div key={i} className="p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center text-center">
                <div className="mb-2">{stat.icon}</div>
                <span className="text-2xl font-black text-gray-800 dark:text-white">{stat.val}</span>
                <span className="text-[10px] uppercase font-bold opacity-50 text-gray-600 dark:text-gray-300">{stat.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};