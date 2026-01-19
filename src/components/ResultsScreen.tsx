import { useState } from 'react';
import { getUserRank } from '../utils/gameUtils';

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

  const getProgress = (s: number) => {
    if (s < 2000) return (s / 2000) * 100;
    if (s < 5000) return ((s - 2000) / 3000) * 100;
    if (s < 10000) return ((s - 5000) / 5000) * 100;
    if (s < 50000) return ((s - 10000) / 40000) * 100;
    if (s < 100000) return ((s - 50000) / 50000) * 100;
    if (s < 200000) return ((s - 100000) / 100000) * 100;
    if (s < 500000) return ((s - 200000) / 300000) * 100;
    return 100;
  };

  return (
    <div className="h-full w-full max-w-md mx-auto p-6 flex flex-col items-center justify-center animate-pop relative">
      {/* Модальное окно повышения ранга */}
      {showRankModal && newRankReached && (
        <div className="rank-modal-overlay">
          <div className="rank-modal-content">
            <div className="rank-modal-gradient-bar"></div>
            <img src="./image/crown.png" alt="Rank Up" className="rank-modal-icon" />
            <h2 className="rank-modal-title">Повышение!</h2>
            <p className="rank-modal-subtitle">Твои знания растут! Новое звание:</p>
            <div className="rank-modal-box">
              <p className="rank-modal-rank-name">{newRankReached}</p>
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
          <div className="round-end-progress-scale" style={{ width: `${Math.min(100, getProgress(totalScore))}%` }}></div>
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