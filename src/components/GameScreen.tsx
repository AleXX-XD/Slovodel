import { formatTime } from '../utils/gameUtils';
import type { WordEntry } from '../types';
import { Settings, Delete, Trash2, Hourglass, Lightbulb, SquareAsterisk, RefreshCw, Info } from 'lucide-react';

interface GameScreenProps {
  score: number;
  isDailyMode: boolean;
  timeLeft: number;
  onOpenAbout: () => void;
  onOpenMenu: () => void;
  hintWord: string | null;
  isDefinitionLoading: boolean;
  hintDefinition: string | null;
  foundWords: WordEntry[];
  currentInput: string[];
  setCurrentInput: React.Dispatch<React.SetStateAction<string[]>>;
  playSfx: (key: any) => void;
  handleAddTime: () => void;
  bonusTimeLeft: number;
  handleHint: () => void;
  bonusHintLeft: number;
  handleWildcard: () => void;
  bonusWildcardLeft: number;
  wildcardActiveSeconds: number;
  hintActiveSeconds: number;
  toggleSwapMode: () => void;
  bonusSwapLeft: number;
  isSwapActive: boolean;
  grid: string[];
  hintIndices: Set<number>;
  startSwap: (idx: number) => void;
  checkWord: () => void;
  performSwap: (char: string) => void;
  swapTargetIdx: number | null;
  setSwapTargetIdx: (val: number | null) => void;
  showConfirm: boolean;
  setShowConfirm: (val: boolean) => void;
  finishGame: () => void;
  setGrid: (grid: string[]) => void;
  onOpenShop: () => void;
}

export const GameScreen = (props: GameScreenProps) => {
  const {
    score, isDailyMode, timeLeft, onOpenAbout, onOpenMenu, hintWord, isDefinitionLoading, hintDefinition,
    foundWords, currentInput, setCurrentInput, playSfx, handleAddTime, bonusTimeLeft,
    handleHint, bonusHintLeft, handleWildcard, bonusWildcardLeft, wildcardActiveSeconds,
    hintActiveSeconds, toggleSwapMode, bonusSwapLeft, isSwapActive, grid, hintIndices, startSwap, checkWord,
    performSwap, swapTargetIdx, setSwapTargetIdx, showConfirm, setShowConfirm, finishGame, setGrid, onOpenShop
  } = props;

  return (
    <div className="game-container">
      {/* Модалка замены */}
      {swapTargetIdx !== null && (
        <div className="modal-overlay z-[60]">
          <div className="modal-content">
            <h3 className="swap-modal-title">Замена</h3>
            <p className="swap-modal-text">Введите букву:</p>
            <input
              autoFocus
              className="swap-modal-input"
              maxLength={1}
              onChange={(e) => performSwap(e.target.value)}
            />
            <button onClick={() => setSwapTargetIdx(null)} className="swap-modal-cancel-btn">Отмена</button>
          </div>
        </div>
      )}

      {/* Хедер */}
      <header className="game-header">
        <div className="flex flex-col">
          <div className="game-score">{score}</div>
          {isDailyMode && <div className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">День 🏆</div>}
        </div>
        <div className={`game-timer ${timeLeft < 10 ? 'game-timer-warning' : 'game-timer-normal'}`}>{formatTime(timeLeft)}</div>
        <div className="flex gap-2">
          <button onClick={() => { playSfx('click'); onOpenAbout(); }} className="game-header-btn text-cyan-500"><Info size={24} /></button>
          <button onClick={() => { playSfx('click'); onOpenMenu(); }} className="game-header-btn"><Settings size={24} /></button>
        </div>
      </header>

      {/* Область найденных слов */}
      <div className="game-board-area">
        {hintWord && (
          <div className="hint-box">
            <div className="hint-label">Подсказка</div>
            {hintActiveSeconds > 0 ? (
              <div className="hint-text">{isDefinitionLoading ? "Загрузка..." : hintDefinition}</div>
            ) : (
              <div className="hint-word">{hintWord}</div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 content-start">
          {foundWords.map((w, i) => (
            <div key={i} className="found-word-tag">
              <span className={w.text.length >= 7 ? "found-word-tag-rare" : ""}>{w.text.toUpperCase()}</span>
              <span className="found-word-score">+{w.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Игровая панель */}
      <div className="game-panel">
        {/* Бонусы */}
        <div className="mb-5 flex justify-around items-center">
          {[
            { icon: <Hourglass size={32} className="text-icon-indigo bonus-icon-base" />, count: bonusTimeLeft, action: handleAddTime, active: true },
            { icon: <Lightbulb size={32} className="text-icon-amber bonus-icon-base" />, count: hintActiveSeconds > 0 ? `${hintActiveSeconds}c` : bonusHintLeft, action: handleHint, active: true, pulse: hintActiveSeconds > 0, ringClass: 'ring-amber-400/50' },
            { icon: <SquareAsterisk size={32} className="text-icon-purple bonus-icon-base" />, count: wildcardActiveSeconds > 0 ? `${wildcardActiveSeconds}c` : bonusWildcardLeft, action: handleWildcard, active: wildcardActiveSeconds > 0, pulse: wildcardActiveSeconds > 0, ringClass: 'ring-purple-400/50' },
            { icon: <RefreshCw size={32} className="text-icon-pink bonus-icon-base" />, count: bonusSwapLeft, action: toggleSwapMode, active: isSwapActive }
          ].map((btn, i) => {
            const isZero = typeof btn.count === 'number' && btn.count <= 0 && !btn.pulse;
            return (
              <button 
                key={i} 
                onClick={isZero ? (isDailyMode ? undefined : () => { playSfx('click'); onOpenShop(); }) : btn.action} 
                className={`bonus-btn-wrapper ${isZero && isDailyMode ? 'bonus-btn-disabled' : 'bonus-btn-active'}`}
                disabled={isZero && isDailyMode}
              >
                <div className={`bonus-btn-container ${btn.pulse ? `animate-pulse ring-4 ${btn.ringClass}` : ''}`}>
                  {btn.icon}
                </div>
                <span className={`bonus-badge ${isZero && !isDailyMode ? 'bonus-badge-zero' : 'bonus-badge-normal'}`}>
                  {isZero ? (isDailyMode ? '0' : '+') : btn.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Поле ввода */}
        <div className="input-field-container">
          {currentInput.length > 0 && (
            <button onClick={() => { playSfx('click'); setCurrentInput([]); }} className="absolute left-2 p-2 input-field-element hover:text-red-400 transition-colors" title="Стереть все"><Trash2 size={24} /></button>
          )}
          <div 
            className={`input-text ${currentInput.length > 12 ? 'text-right' : 'text-center'}`}
            style={{ direction: currentInput.length > 12 ? 'rtl' : 'ltr' }}
          >
            {currentInput.length > 0 ? <span style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{currentInput.join('')}</span> : <span className="input-placeholder">Слово...</span>}
          </div>
          {currentInput.length > 0 && (
            <button onClick={() => { playSfx('click'); setCurrentInput(prev => prev.slice(0, -1)); }} className="absolute right-2 p-2 input-field-element hover:text-indigo-500 transition-colors"><Delete size={24} /></button>
          )}
        </div>

        {/* Сетка букв */}
        <div className={`grid ${grid.length === 10 ? 'grid-cols-10-custom' : grid.length === 8 ? 'grid-cols-8-custom' : 'grid-cols-6-custom'} gap-2 mb-4`}>
          {grid.map((letter, idx) => (
            <button key={idx} onClick={() => { if (isSwapActive) startSwap(idx); else { playSfx('click'); setCurrentInput(p => [...p, letter]); } }} className={`${grid.length === 10 ? 'aspect-10' : grid.length === 8 ? 'aspect-8' : 'aspect-6'} letter-btn ${hintIndices.has(idx) ? 'letter-btn-hint' : ''}`}>{letter}</button>
          ))}
        </div>

        {/* Кнопки управления */}
        <div className="game-controls">
          <button onClick={() => { playSfx('click'); setGrid([...grid].sort(() => Math.random() - 0.5)); }} className="btn-control-mix">Микс</button>
          <button onClick={checkWord} disabled={currentInput.length === 0} className={`btn-control-enter ${currentInput.length > 0 ? 'btn-control-enter-active' : 'btn-enter-disabled'}`}>Ввод</button>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay z-[70]">
          <div className="modal-content">
            <h3 className="modal-title">Завершить раунд?</h3>
            <div className="flex gap-3">
              <button onClick={() => { playSfx('click'); setShowConfirm(false); }} className="confirm-modal-cancel">Нет</button>
              <button onClick={() => { playSfx('click'); finishGame(); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/30">Да</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};