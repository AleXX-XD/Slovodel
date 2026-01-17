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
  message: { text: string, type: 'good' | 'bad' } | null;
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
    performSwap, swapTargetIdx, setSwapTargetIdx, message, showConfirm, setShowConfirm, finishGame, setGrid, onOpenShop
  } = props;

  return (
    <div className="h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden relative">
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
      <header className="p-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex flex-col">
          <div className="game-score">{score}</div>
          {isDailyMode && <div className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">День 🏆</div>}
        </div>
        <div className={`timer-base ${timeLeft < 10 ? 'timer-warning' : 'timer-normal'}`}>{formatTime(timeLeft)}</div>
        <div className="flex gap-2">
          <button onClick={() => { playSfx('click'); onOpenAbout(); }} className="game-header-btn text-cyan-500"><Info size={24} /></button>
          <button onClick={() => { playSfx('click'); onOpenMenu(); }} className="game-header-btn"><Settings size={24} /></button>
        </div>
      </header>

      {/* Область найденных слов */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
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
            <div key={i} className="found-word-item">
              <span className={w.text.length >= 7 ? "text-amber-500" : ""}>{w.text.toUpperCase()}</span>
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
                className={`relative flex flex-col items-center group transition-all ${isZero && isDailyMode ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95'}`}
                disabled={isZero && isDailyMode}
              >
                <div className={`bonus-btn-container ${btn.pulse ? `animate-pulse ring-4 ${btn.ringClass}` : ''}`}>
                  {btn.icon}
                </div>
                <span className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${isZero && !isDailyMode ? 'bg-green-500 text-white' : 'bonus-badge-normal'}`}>
                  {isZero ? (isDailyMode ? '0' : '+') : btn.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Поле ввода */}
        <div className="input-field-container">
          {currentInput.length > 0 && (
            <button onClick={() => { playSfx('click'); setCurrentInput([]); }} className="absolute left-2 p-2 text-gray-400 hover:text-red-400 transition-colors" title="Стереть все"><Trash2 size={24} /></button>
          )}
          <div 
            className={`input-text ${currentInput.length > 12 ? 'text-right' : 'text-center'}`}
            style={{ direction: currentInput.length > 12 ? 'rtl' : 'ltr' }}
          >
            {currentInput.length > 0 ? <span style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{currentInput.join('')}</span> : <span className="input-placeholder">Слово...</span>}
          </div>
          {currentInput.length > 0 && (
            <button onClick={() => { playSfx('click'); setCurrentInput(prev => prev.slice(0, -1)); }} className="absolute right-2 p-2 text-gray-400 hover:text-indigo-500 transition-colors"><Delete size={24} /></button>
          )}
        </div>

        {/* Сетка букв */}
        <div className={`grid ${grid.length === 10 ? 'grid-cols-5' : grid.length === 8 ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-4`}>
          {grid.map((letter, idx) => (
            <button key={idx} onClick={() => { if (isSwapActive) startSwap(idx); else { playSfx('click'); setCurrentInput(p => [...p, letter]); } }} className={`${grid.length === 10 ? 'aspect-square' : grid.length === 8 ? 'aspect-[5/4]' : 'aspect-[5/3]'} letter-btn ${hintIndices.has(idx) ? 'letter-btn-hint' : ''}`}>{letter}</button>
          ))}
        </div>

        {/* Кнопки управления */}
        <div className="flex gap-3">
          <button onClick={() => { playSfx('click'); setGrid([...grid].sort(() => Math.random() - 0.5)); }} className="flex-1 py-4 bg-gradient-to-b from-blue-400 to-blue-600 text-white font-bold rounded-2xl active:scale-95 transition-all uppercase text-lg tracking-widest shadow-lg">Микс</button>
          <button onClick={checkWord} disabled={currentInput.length === 0} className={`flex-[2] py-4 font-bold rounded-2xl transition-all uppercase text-lg tracking-widest shadow-lg ${currentInput.length > 0 ? 'bg-gradient-to-b from-green-400 to-green-600 text-white active:scale-95' : 'btn-enter-disabled'}`}>Ввод</button>
        </div>
      </div>

      {/* Тосты и модалки */}
      {message && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-bold text-white shadow-2xl z-[200] animate-bounce text-center backdrop-blur-md border border-white/20 ${message.type === 'good' ? 'bg-indigo-600/90' : 'bg-red-500/90'}`}>
          {message.text}
        </div>
      )}

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