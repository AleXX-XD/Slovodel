import { Trophy, X, Zap } from 'lucide-react';
import { LEADERBOARD_TOP_LIMIT } from '../utils/constants';
 
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
        <div className="modal-header-container">
          <div className="modal-header-title-group">
            <Trophy size={28} className="modal-header-icon text-yellow-500" />
            <h2 className="modal-header-text">Топ Эрудитов</h2>
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
              // 1. Присваиваем ранги всем (Dense Rank)
              let currentRank = 1;
              const rankedData = data.map((player, i) => {
                if (i > 0 && player.score < data[i - 1].score) {
                  currentRank++;
                }
                return { ...player, rank: currentRank };
              });

              // 2. Показываем только топ мест
              const topList = rankedData.filter(p => p.rank <= LEADERBOARD_TOP_LIMIT);
              
              // 3. Ищем текущего юзера в загруженном списке
              const userInList = rankedData.find(p => p.telegram_id === currentUserId);

              return (
                <>
                  {topList.map((player, i) => {
                    const isCurrentUser = player.telegram_id === currentUserId;
                    return (
                      <div 
                        key={i} 
                        onClick={() => onPlayerClick?.(player)}
                        className={`leaderboard-card ${isCurrentUser ? 'leaderboard-card-active' : ''} cursor-pointer active:scale-[0.98]`}
                      >
                        <div className="w-8 flex justify-center items-center font-bold text-gray-500 dark:text-gray-400">
                          {getPlaceIcon(player.rank - 1)}
                        </div>
                        <img src={player.avatar_url || './image/book_face.png'} alt="avatar" className="avatar-sm" />
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`leaderboard-name ${isCurrentUser ? 'leaderboard-name-active' : ''}`}>{player.name}</p>
                          <p className="leaderboard-subtext">{activeTab === 'all' ? getUserRank(player.score) : 'Очки за испытание'}</p>
                        </div>
                        <span className="leaderboard-points">{player.score}</span>
                      </div>
                    );
                  })}

                  {/* Если юзер есть в списке, но не в топ-N */}
                  {userInList && userInList.rank > LEADERBOARD_TOP_LIMIT && (
                    <>
                      {userInList.rank > LEADERBOARD_TOP_LIMIT + 1 && (
                        <div className="text-center font-bold opacity-50 my-2 text-xs tracking-widest">. . .</div>
                      )}
                      <div 
                        className="leaderboard-card leaderboard-card-active cursor-pointer active:scale-[0.98] border-t-2 border-indigo-100 dark:border-indigo-900/50 mt-1"
                        onClick={() => onPlayerClick?.(userInList)}
                      >
                        <div className="w-8 flex justify-center items-center font-bold text-indigo-600 dark:text-indigo-400">
                          {userInList.rank}.
                        </div>
                        <img src={userInList.avatar_url || './image/book_face.png'} alt="avatar" className="avatar-md" />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="leaderboard-name leaderboard-name-active">{userInList.name} (Вы)</p>
                          <p className="leaderboard-subtext">{activeTab === 'all' ? getUserRank(userInList.score) : 'Очки за испытание'}</p>
                        </div>
                        <span className="leaderboard-points">{userInList.score}</span>
                      </div>
                    </>
                  )}

                  {/* Если юзера нет в списке (ранг > загруженного лимита), но есть внешние данные о ранге */}
                  {!userInList && currentUserRankData && (
                    <>
                      <div className="text-center font-bold opacity-50 my-2 text-xs tracking-widest">. . .</div>
                      <div 
                        className="leaderboard-card leaderboard-card-active cursor-pointer active:scale-[0.98] border-t-2 border-indigo-100 dark:border-indigo-900/50 mt-1"
                        onClick={() => onPlayerClick?.({ ...currentUserRankData, telegram_id: currentUserId })}
                      >
                        <div className="w-8 flex justify-center items-center font-bold text-indigo-600 dark:text-indigo-400">
                          {currentUserRankData.rank}.
                        </div>
                        <img src={currentUserRankData.avatar_url || './image/book_face.png'} alt="avatar" className="avatar-md" />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="leaderboard-name leaderboard-name-active">{currentUserRankData.username} (Вы)</p>
                          <p className="leaderboard-subtext">{getUserRank(currentUserRankData.score)}</p>
                        </div>
                        <span className="leaderboard-points">{currentUserRankData.score}</span>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
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