import { useState } from 'react';
import { getUserRank, getLevelProgress, getLevelData, getRankMeta } from '../utils/gameUtils';

interface ResultsScreenProps {
  score: number;
  lastRoundRecordBeaten: number | null;
  totalScore: number;
  userName: string;
  onMenu: () => void;
  newRankReached: string | null;
  onRankModalClose: () => void;
}

export const ResultsScreen = ({ score, lastRoundRecordBeaten, totalScore, userName, onMenu, newRankReached, onRankModalClose }: ResultsScreenProps) => {
  const [showRankModal, setShowRankModal] = useState(!!newRankReached);

  const levelData = getLevelData(totalScore);
  const currentRankMeta = getRankMeta(levelData.level);
  const isNewTitle = currentRankMeta.minLevel === levelData.level;

  return (
    <div className="h-full w-full max-w-md mx-auto p-6 flex flex-col items-center justify-center animate-pop relative">
      {/* Модальное окно повышения ранга */}
      {showRankModal && newRankReached && (
        <div className="rank-modal-overlay">
          <div className="rank-modal-content">
            <div className="rank-modal-gradient-bar"></div>
            <div className="w-24 h-24 mx-auto mb-4 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center p-2 shadow-inner">
               <img src={currentRankMeta.img} alt="Rank Up" className="w-full h-full object-contain animate-bounce-slow" />
            </div>
            <h2 className="rank-modal-title">Повышение!</h2>
            <p className="rank-modal-subtitle">Твои знания растут! Новый уровень:</p>
            <div className="rank-modal-box">
              <p className="rank-modal-rank-name">{newRankReached}</p>
              {isNewTitle && <div className="mt-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-lg text-xs font-bold uppercase animate-pulse">👑 Новое звание!</div>}
              <p className="text-sm font-normal opacity-70 mt-1">Звание: {currentRankMeta.name}</p>
            </div>
            <button 
              onClick={() => { setShowRankModal(false); onRankModalClose(); }}
              className="rank-modal-button"
            >
              Отлично!
            </button>
          </div>
        </div>
      )}

      <h2 className="round-end-up">Раунд окончен</h2>
      
      <div className="relative">
        <div className="round-end-score">{score}</div>
      </div>

      {lastRoundRecordBeaten !== null && (
        <div className="mb-8 text-center animate-bounce">
          <div className="round-end-record">
            <p className="font-bold text-sm uppercase tracking-wide">🏆 Новый рекорд!</p>
          </div>
        </div>
      )}

      <div className="round-end-bg">
        <div className="round-end-progress">Ваш прогресс</div>
        <div className="round-end-progress-rank">
          <div className="round-end-progress-scale" style={{ width: `${Math.min(100, getLevelProgress(totalScore))}%` }}></div>
        </div>
        <div className="flex justify-between items-end">
            <p className="round-end-name">{userName}</p>
            <p className="round-end-rank">{getUserRank(totalScore)}</p>
        </div>
      </div>

      <button onClick={onMenu} className="leaderboard-close">В меню</button>
    </div>
  );
};