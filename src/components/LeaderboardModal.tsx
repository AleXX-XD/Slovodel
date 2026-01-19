import { Trophy, X, Zap } from 'lucide-react';
 
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
  } | null | undefined;
  userScore?: number;
  totalPlayers?: number;
  getUserRank: (score: number) => string;
  activeTab: 'all' | 'daily' | 'previous';
  onTabChange: (tab: 'all' | 'daily' | 'previous') => void;
  isLoading?: boolean;
  onPlayerClick?: (player: any) => void;
}

export const LeaderboardModal = ({ data, onClose, playSfx, currentUserId, currentUserRankData, totalPlayers, getUserRank, activeTab, onTabChange, isLoading, onPlayerClick }: LeaderboardModalProps) => {

  const getPlaceIcon = (index: number) => {
    if (index === 0) return <span className="text-xl">🥇</span>;
    if (index === 1) return <span className="text-xl">🥈</span>;
    if (index === 2) return <span className="text-xl">🥉</span>;
    return <span className="leaderboard-place">{index + 1}.</span>;
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
           Всё время
          </button>
          <button 
            onClick={() => onTabChange('daily')}
            className={`tab-item ${activeTab === 'daily' ? 'tab-item-active' : ''}`}
          >
            <Zap size={12} fill="currentColor"/>Сегодня         
          </button>
          <button 
            onClick={() => onTabChange('previous')}
            className={`tab-item ${activeTab === 'previous' ? 'tab-item-active' : ''}`}
          >
            <Zap size={12} fill="currentColor"/>Вчера
          </button>
        </div>
        
        {/* Total Players Count */}
        <div className="text-center mb-2 shrink-0">
           <p className="leaderboard-total-players">
             {activeTab === 'all' ? 'Всего игроков:' : activeTab === 'daily' ? 'Испытание дня | Участников сегодня:' : 'Испытание дня | Участников вчера:'} <span className="leaderboard-total-count">{totalPlayers || 0}</span>
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
                  <div 
                    key={i} 
                    onClick={() => onPlayerClick?.(player)}
                    className={`leaderboard-card ${isCurrentUser ? 'leaderboard-card-active' : ''} cursor-pointer active:scale-[0.98]`}
                  >
                    <div className="w-6 flex justify-center items-center">
                      {getPlaceIcon(rank - 1)}
                    </div>
                    <img src={player.avatar_url || './image/book_face.png'} alt="avatar" className="w-8 h-8 rounded-full bg-indigo-100" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`leaderboard-name ${isCurrentUser ? 'leaderboard-name-active' : ''}`}>{player.name}</p>
                      <p className="leaderboard-subtext">{activeTab === 'all' ? getUserRank(player.score) : 'Очки за испытание'}</p>
                    </div>
                    <span className="leaderboard-points">{player.score}</span>
                  </div>
                );
              });
            })()}

            {(currentUserRankData) && activeTab === 'all' && (
              <>
                {currentUserRankData.rank > data.length + 1 && (
                  <div className="text-center font-bold opacity-50 my-4">...</div>
                )}
                <div 
                  className="leaderboard-card leaderboard-card-active cursor-pointer active:scale-[0.98]"
                  onClick={() => onPlayerClick?.({ ...currentUserRankData, telegram_id: currentUserId })}
                >
                  <div className="w-6 flex justify-center items-center">
                    {getPlaceIcon(currentUserRankData.rank - 1)}
                  </div>
                  <img src={currentUserRankData.avatar_url || './image/book_face.png'} alt="avatar" className="w-10 h-10 rounded-full bg-indigo-100" />
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
        <button onClick={() => { playSfx('click'); onClose(); }} className="leaderboard-close">Закрыть</button>
      </div>
    
    </div>
  </div>
  );
};