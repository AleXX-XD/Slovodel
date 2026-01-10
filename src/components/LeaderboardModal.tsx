import { Medal } from 'lucide-react';
 
interface LeaderboardModalProps {
  data: any[];
  onClose: () => void;
  playSfx: (sound: any) => void;
  currentUserId?: number;
  currentUserRankData?: {
    rank: number;
    score: number;
    username: string;
    avatar_url: string;
  } | null;
  userScore?: number;
  totalPlayers?: number;
  getUserRank: (score: number) => string;
  activeTab: 'all' | 'daily' | 'previous';
  onTabChange: (tab: 'all' | 'daily' | 'previous') => void;
  isLoading?: boolean;
}

export const LeaderboardModal = ({ data, onClose, playSfx, currentUserId, currentUserRankData, totalPlayers, getUserRank, activeTab, onTabChange, isLoading }: LeaderboardModalProps) => {
  
  const getPlaceIcon = (index: number) => {
    if (index === 0) {
      return <Medal className="w-6 h-6 text-yellow-400" />;
    }
    if (index === 1) {
      return <Medal className="w-6 h-6 text-gray-400" />;
    }
    if (index === 2) {
      return <Medal className="w-6 h-6 text-amber-700" />;
    }
    return <span className="font-bold w-6 text-center text-gray-500 dark:text-gray-400">{index + 1}.</span>;
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-pop border border-white/20 h-[85vh] relative">
      <div className="bg-white/50 dark:bg-white/5 p-4 text-gray-900 dark:text-white shrink-0 text-center shadow-lg z-10 border-b border-white/10">
        <h2 className="text-2xl font-black uppercase tracking-tight drop-shadow-lg flex items-center justify-center gap-2">Топ Эрудитов <img src="./image/cup.png" alt="cup" className="w-8 h-8" /></h2>
        
        <div className="flex bg-black/5 dark:bg-black/20 p-1 rounded-xl mt-4">
          <button 
            onClick={() => onTabChange('all')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            За всё время
          </button>
          <button 
            onClick={() => onTabChange('daily')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'daily' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Испытание дня
          </button>
          <button 
            onClick={() => onTabChange('previous')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'previous' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Вчера
          </button>
        </div>
        
        {/* Total Players Count */}
        <div className="mt-3 text-center">
           <p className="text-[10px] uppercase font-bold opacity-50">
             {activeTab === 'all' ? 'Всего игроков:' : activeTab === 'daily' ? 'Участников сегодня:' : 'Участников вчера:'} <span className="text-indigo-600 dark:text-indigo-300">{totalPlayers || 0}</span>
           </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {isLoading ? (
          <p className="text-center opacity-50">Загрузка данных...</p>
        ) : data.length === 0 ? (
          <p className="text-center opacity-50">Участники не найдены</p>
        ) : (
          <>
            {(() => {
              let currentRank = 1;
              return data.map((player: any, i: number) => {
                // Если очки текущего игрока меньше предыдущего, увеличиваем ранг
                if (i > 0 && player.score < data[i - 1].score) {
                  currentRank++;
                }
                const rank = currentRank;
                const isCurrentUser = player.telegram_id === currentUserId;
                return (
                  <div key={i} className={`p-3 rounded-2xl flex items-center gap-3 border ${isCurrentUser ? 'bg-indigo-100 dark:bg-indigo-500/30 border-indigo-200 dark:border-indigo-400/50' : 'bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/10'}`}>
                    <div className="w-6 flex justify-center items-center">
                      {getPlaceIcon(rank - 1)}
                    </div>
                    <img src={player.avatar_url || './image/book_face_1.png'} alt="avatar" className="w-10 h-10 rounded-full bg-indigo-100" />
                    <div className="flex-1">
                      <p className={`font-bold truncate ${isCurrentUser ? 'text-indigo-600 dark:text-indigo-200' : 'text-gray-800 dark:text-white'}`}>{player.name}</p>
                      <p className="text-[10px] font-bold opacity-50 uppercase text-gray-600 dark:text-white/70">{activeTab === 'all' ? getUserRank(player.score) : 'Очки за день'}</p>
                    </div>
                    <span className="font-black text-amber-600 dark:text-amber-300">{player.score}</span>
                  </div>
                );
              });
            })()}

            {currentUserRankData && activeTab === 'all' && (
              <>
                <div className="text-center font-black opacity-50 my-4">...</div>
                <div className="p-3 rounded-2xl flex items-center gap-3 border bg-indigo-100 dark:bg-indigo-500/30 border-indigo-200 dark:border-indigo-400/50">
                  <div className="w-6 flex justify-center items-center">
                    {getPlaceIcon(currentUserRankData.rank - 1)}
                  </div>
                  <img src={currentUserRankData.avatar_url || './image/book_face_1.png'} alt="avatar" className="w-10 h-10 rounded-full bg-indigo-100" />
                  <div className="flex-1">
                    <p className="font-bold truncate text-indigo-600 dark:text-indigo-200">{currentUserRankData.username}</p>
                    <p className="text-[10px] font-bold opacity-50 uppercase text-gray-600 dark:text-white/70">{getUserRank(currentUserRankData.score)}</p>
                  </div>
                  <span className="font-black text-amber-600 dark:text-amber-300">{currentUserRankData.score}</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
      <div className="p-4 shrink-0">
        <button onClick={() => { playSfx('click'); onClose(); }} className="w-full py-4 bg-white/60 dark:bg-white/20 backdrop-blur-md text-indigo-700 dark:text-white font-bold rounded-2xl border border-white/40 dark:border-white/20 active:scale-95 shadow-lg hover:bg-white/80 dark:hover:bg-white/30">Закрыть</button>
      </div>
    </div>
  </div>
  );
};