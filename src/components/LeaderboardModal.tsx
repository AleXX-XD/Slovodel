import { Trophy, X } from 'lucide-react';
 
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
    if (index === 0) return <span className="text-xl">🥇</span>;
    if (index === 1) return <span className="text-xl">🥈</span>;
    if (index === 2) return <span className="text-xl">🥉</span>;
    return <span className="font-bold w-6 text-center text-gray-500 dark:text-gray-400">{index + 1}.</span>;
  };
  
  return (
    <div className="modal-overlay z-[400]">
      <div className="modal-content h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <Trophy size={28} className="modal-header-icon text-yellow-500" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Топ Эрудитов</h2>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
            <X size={24} className="modal-icon" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="tabs-group mb-4 shrink-0">
          <button 
            onClick={() => onTabChange('all')}
            className={`tab-item ${activeTab === 'all' ? 'tab-item-active' : ''}`}
          >
            За всё время
          </button>
          <button 
            onClick={() => onTabChange('daily')}
            className={`tab-item ${activeTab === 'daily' ? 'tab-item-active' : ''}`}
          >
            Сегодня
          </button>
          <button 
            onClick={() => onTabChange('previous')}
            className={`tab-item ${activeTab === 'previous' ? 'tab-item-active' : ''}`}
          >
            Вчера
          </button>
        </div>
        
        {/* Total Players Count */}
        <div className="text-center mb-2 shrink-0">
           <p className="text-[10px] uppercase font-bold opacity-50 text-gray-500 dark:text-gray-400">
             {activeTab === 'all' ? 'Всего игроков:' : activeTab === 'daily' ? 'Участников сегодня:' : 'Участников вчера:'} <span className="text-indigo-600 dark:text-indigo-300 font-bold">{totalPlayers || 0}</span>
           </p>
        </div>

        {/* List */}
        <div className="leaderboard-scroll">
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
                  <div key={i} className={`leaderboard-card ${isCurrentUser ? 'leaderboard-card-active' : ''}`}>
                    <div className="w-6 flex justify-center items-center">
                      {getPlaceIcon(rank - 1)}
                    </div>
                    <img src={player.avatar_url || './image/book_face_1.png'} alt="avatar" className="w-10 h-10 rounded-full bg-indigo-100" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`leaderboard-name ${isCurrentUser ? 'leaderboard-name-active' : ''}`}>{player.name}</p>
                      <p className="leaderboard-subtext">{activeTab === 'all' ? getUserRank(player.score) : 'Очки за день'}</p>
                    </div>
                    <span className="leaderboard-points">{player.score}</span>
                  </div>
                );
              });
            })()}

            {currentUserRankData && activeTab === 'all' && (
              <>
                <div className="text-center font-bold opacity-50 my-4">...</div>
                <div className="leaderboard-card leaderboard-card-active">
                  <div className="w-6 flex justify-center items-center">
                    {getPlaceIcon(currentUserRankData.rank - 1)}
                  </div>
                  <img src={currentUserRankData.avatar_url || './image/book_face_1.png'} alt="avatar" className="w-10 h-10 rounded-full bg-indigo-100" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="leaderboard-name leaderboard-name-active">{currentUserRankData.username}</p>
                    <p className="leaderboard-subtext">{getUserRank(currentUserRankData.score)}</p>
                  </div>
                  <span className="leaderboard-points">{currentUserRankData.score}</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-2 shrink-0">
        <button onClick={() => { playSfx('click'); onClose(); }} className="w-full py-3 bg-white/60 dark:bg-white/20 backdrop-blur-md text-indigo-700 dark:text-white font-bold rounded-2xl border border-white/40 dark:border-white/20 active:scale-95 shadow-lg hover:bg-white/80 dark:hover:bg-white/30 uppercase text-sm">Закрыть</button>
      </div>

    </div>
  </div>
  );
};