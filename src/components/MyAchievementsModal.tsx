import { useState, useMemo } from 'react';
import { X, BookOpenText, Award, Medal, Lock, Check } from 'lucide-react';
import type { RareWord } from '../types';
import { RANKS } from '../utils/constants';
import { getRankMultiplier, getRankMeta } from '../utils/gameUtils';

interface MyAchievementsModalProps {
  words: RareWord[];
  currentLevel: number;
  stats: {
    totalWords: number;
    highScore: number;
    marathonHighScore: number;
    daysPlayed: number;
  };
  claimedRewards: string[];
  onClaimReward: (id: string, multiplier: number) => void;
  onClose: () => void;
  playSfx: (sound: any) => void;
  unclaimedRewardsCount?: number;
}

const getWordColorClass = (len: number) => {
  if (len >= 11) return 'text-pink-600 dark:text-pink-400';
  if (len >= 9) return 'text-purple-600 dark:text-purple-400';
  if (len >= 7) return 'text-blue-600 dark:text-blue-400';
  return 'text-emerald-600 dark:text-emerald-400';
};

export const MyAchievementsModal = ({ words, currentLevel, stats, claimedRewards, onClaimReward, onClose, playSfx, unclaimedRewardsCount = 0 }: MyAchievementsModalProps) => {
  const [activeTab, setActiveTab] = useState<'collection' | 'rewards' | 'ranks'>('rewards');

  const sortedWords = useMemo(() => [...words].sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return b.score - a.score;
  }), [words]);

  const rare9to10 = useMemo(() => words.filter(w => w.length >= 9 && w.length <= 10).length, [words]);
  const rare11plus = useMemo(() => words.filter(w => w.length >= 11).length, [words]);

  interface RewardItem {
      id: string;
      target: number;
      label: string;
      sub?: string;
      img?: string;
      currentValue: number;
  }

  const REWARD_SECTIONS: { title: string; items: RewardItem[] }[] = [
    {
        title: "НАЙДЕННЫЕ СЛОВА",
        items: [
            { id: 'words_500', target: 500, label: "500 слов", currentValue: stats.totalWords },
            { id: 'words_1000', target: 1000, label: "1000 слов", currentValue: stats.totalWords },
            { id: 'words_2000', target: 2000, label: "2000 слов", currentValue: stats.totalWords },
            { id: 'words_5000', target: 5000, label: "5000 слов", currentValue: stats.totalWords },
            { id: 'words_10000', target: 10000, label: "10 000 слов", currentValue: stats.totalWords },
            { id: 'words_20000', target: 20000, label: "20 000 слов", currentValue: stats.totalWords },
        ]
    },
    {
        title: "РЕКОРД УРОВНЯ",
        items: [
            { id: 'score_1500', target: 1500, label: "1500 очков", currentValue: stats.highScore },
            { id: 'score_3000', target: 3000, label: "3000 очков", currentValue: stats.highScore },
            { id: 'score_5000', target: 5000, label: "5000 очков", currentValue: stats.highScore },
        ]
    },
    {
        title: "СЛОВЕСНЫЙ МАРАФОН",
        items: [
            { id: 'marathon_100', target: 100, label: "Ловец секунд", sub: "+ 100 сек.", img: "./image/time100.png", currentValue: stats.marathonHighScore },
            { id: 'marathon_300', target: 300, label: "Спринтер слов", sub: "+ 300 сек.", img: "./image/time300.png", currentValue: stats.marathonHighScore },
            { id: 'marathon_500', target: 500, label: "Марафонец", sub: "+ 500 сек.", img: "./image/time500.png", currentValue: stats.marathonHighScore },
        ]
    },
    {
        title: "ДНИ В ИГРЕ",
        items: [
            { id: 'days_30', target: 30, label: "30 дней", currentValue: stats.daysPlayed },
            { id: 'days_60', target: 60, label: "60 дней", currentValue: stats.daysPlayed },
            { id: 'days_120', target: 120, label: "120 дней", currentValue: stats.daysPlayed },
            { id: 'days_180', target: 180, label: "180 дней", currentValue: stats.daysPlayed },
            { id: 'days_270', target: 270, label: "270 дней", currentValue: stats.daysPlayed },
            { id: 'days_365', target: 365, label: "365 дней", currentValue: stats.daysPlayed },
        ]
    },
    {
        title: "РЕДКИЕ СЛОВА",
        items: [
            { id: 'rare_total_50', target: 50, label: "50 редких", currentValue: words.length },
            { id: 'rare_total_100', target: 100, label: "100 редких", currentValue: words.length },
            { id: 'rare_total_200', target: 200, label: "200 редких", currentValue: words.length },
            { id: 'rare_9_10', target: 10, label: "10 (9-10 букв)", currentValue: rare9to10 },
            { id: 'rare_9_20', target: 20, label: "20 (9-10 букв)", currentValue: rare9to10 },
            { id: 'rare_11_10', target: 10, label: "10 (11+ букв)", currentValue: rare11plus },
        ]
    }
  ];

  const handleRewardClick = (item: RewardItem) => {
      if (item.currentValue >= item.target && !claimedRewards.includes(item.id)) {
          const rankMeta = getRankMeta(currentLevel);
          const multiplier = getRankMultiplier(rankMeta.name);
          onClaimReward(item.id, multiplier);
      }
  };

  return (
    <div className="modal-overlay z-[400]">
      <div className="modal-content max-w-sm text-left flex flex-col h-[85vh] !p-2">
        
        {/* Header */}
        <div className="modal-header-container shrink-0 px-2 mt-2">
          <div className="modal-header-title-group">
            <Award size={28} className="modal-header-icon text-amber-500" />
            <div>
              <h2 className="modal-header-text">Мои достижения</h2>
            </div>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
            <X size={24} className="modal-icon" />
          </button>
        </div>

        {/* Tabs */}
        <div className="achievements-tabs-container !mx-1">
            <button 
                onClick={() => { playSfx('click'); setActiveTab('collection'); }}
                className={`achievements-tab-btn ${activeTab === 'collection' ? 'achievements-tab-active' : 'achievements-tab-inactive'}`}
            >
                <BookOpenText size={16} />
                Коллекция
            </button>
            <button 
                onClick={() => { playSfx('click'); setActiveTab('rewards'); }}
                className={`achievements-tab-btn relative ${activeTab === 'rewards' ? 'achievements-tab-active' : 'achievements-tab-inactive'}`}
            >
                <Award size={16} />
                Награды
                {unclaimedRewardsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
            </button>
            <button 
                onClick={() => { playSfx('click'); setActiveTab('ranks'); }}
                className={`achievements-tab-btn ${activeTab === 'ranks' ? 'achievements-tab-active' : 'achievements-tab-inactive'}`}
            >
                <Medal size={16} />
                Звания
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-1 pb-2 no-scrollbar">
            
            {/* TAB: COLLECTION */}
            {activeTab === 'collection' && (
                <div className="animate-fade-in space-y-2">
                   {sortedWords.length === 0 ? (
                    <div className="collection-empty-state mt-8">
                      <BookOpenText size={64} strokeWidth={1} className="collection-empty-icon mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="empty-state-text text-center text-gray-500 dark:text-gray-400">Тут пока тишина...<br/>Твои редкие слова всё ещё прячутся в словаре!</p>
                    </div>
                  ) : (
                    <>
                        <div className="text-right text-[10px] font-bold opacity-50 uppercase mb-2 mr-2">Всего слов: {sortedWords.length}</div>
                        {sortedWords.map((word, i) => (
                        <div key={i} className="collection-item">
                            <div className="flex flex-col text-left">
                            <span className={`collection-word ${getWordColorClass(word.length)}`}>{word.text}</span>
                            <span className="collection-meta">{word.length} букв</span>
                            </div>
                            <div className="collection-score">
                            +{word.score}
                            </div>
                        </div>
                        ))}
                    </>
                  )}
                </div>
            )}

            {/* TAB: REWARDS */}
            {activeTab === 'rewards' && (
                <div className="animate-fade-in space-y-6 pt-2 pb-4">
                    {REWARD_SECTIONS.map((section, idx) => (
                        <div key={idx}>
                            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1">{section.title}</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {section.items.map((item) => {
                                    const isUnlocked = item.currentValue >= item.target;
                                    const isClaimed = claimedRewards.includes(item.id);
                                    
                                    return (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleRewardClick(item)}
                                            className="flex flex-col items-center gap-2 cursor-pointer group"
                                        >
                                            <div className={`relative w-full aspect-square rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500 overflow-hidden border-2 ${isUnlocked ? 'border-indigo-100 dark:border-slate-600 bg-white dark:bg-slate-800' : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'}`}>
                                                <img 
                                                    src={item.img || './image/reward.png'} 
                                                    alt={item.label} 
                                                    className={`w-full h-full object-cover ${isUnlocked ? '' : 'grayscale opacity-40'}`} 
                                                />
                                                
                                                {/* Overlay for Claimable */}
                                                {isUnlocked && !isClaimed && (
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center animate-pulse">
                                                        <span className="text-2xl">🎁</span>
                                                    </div>
                                                )}
                                                
                                                {/* Checkmark for Claimed */}
                                                {isClaimed && (
                                                    <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5 shadow-md">
                                                        <Check size={10} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center w-full">
                                                <p className={`text-[10px] font-bold leading-tight ${isUnlocked ? 'text-indigo-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{item.label}</p>
                                                {item.sub && <p className="text-[9px] font-medium text-amber-500 mt-0.5">{item.sub}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: RANKS */}
            {activeTab === 'ranks' && (
                <div className="animate-fade-in space-y-2">
                    {RANKS.map((rank, i) => {
                      const isUnlocked = currentLevel >= rank.minLevel;
                      return (
                        <div key={i} className={`rank-item transition-all duration-300 ${!isUnlocked ? 'grayscale opacity-70' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 flex items-center justify-center bg-indigo-50 dark:bg-slate-700 rounded-xl shrink-0 p-1 ${!isUnlocked ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
                                    <img src={rank.img} alt={rank.name} className="w-full h-full object-contain drop-shadow-sm" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <p className="rank-title">{rank.name}</p>
                                        {!isUnlocked && <Lock size={12} className="text-gray-400" />}
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{rank.levels}</p>
                                </div>
                            </div>
                        </div>
                      );
                    })}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};