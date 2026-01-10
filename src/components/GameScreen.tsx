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
    <div className="h-full w-full max-w-md mx-auto flex flex-col relative overflow-hidden">
      {/* Модалка замены */}
      {swapTargetIdx !== null && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl p-8 w-full text-center animate-pop max-w-[280px] shadow-2xl border border-white/20">
            <h3 className="text-xl font-black text-indigo-600 uppercase">Замена</h3>
            <p className="text-xs opacity-60 mt-2 text-gray-600 dark:text-white">Введите букву:</p>
            <input
              autoFocus
              className="w-20 h-20 text-4xl text-center rounded-2xl my-6 uppercase outline-none bg-gray-100 dark:bg-black/20 text-gray-900 dark:text-white font-black border border-gray-200 dark:border-white/10 shadow-inner"
              maxLength={1}
              onChange={(e) => performSwap(e.target.value)}
            />
            <button onClick={() => setSwapTargetIdx(null)} className="w-full py-3 bg-gray-200 dark:bg-gray-800 rounded-xl font-bold text-gray-500">Отмена</button>
          </div>
        </div>
      )}

      {/* Хедер */}
      <header className="p-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex flex-col">
          <div className="font-black text-indigo-600 dark:text-white text-2xl drop-shadow-md">{score}</div>
          {isDailyMode && <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider">День 🏆</div>}
        </div>
        <div className={`text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 dark:text-red-400 animate-pulse' : 'text-gray-700 dark:text-white/90'}`}>{formatTime(timeLeft)}</div>
        <div className="flex gap-2">
          <button onClick={() => { playSfx('click'); onOpenAbout(); }} className="p-3 bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/40 dark:border-white/10 active:scale-95 shadow-lg text-blue-500 dark:text-blue-300"><Info size={24} /></button>
          <button onClick={() => { playSfx('click'); onOpenMenu(); }} className="p-3 bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/40 dark:border-white/10 active:scale-95 shadow-lg text-gray-600 dark:text-white/70"><Settings size={24} /></button>
        </div>
      </header>

      {/* Область найденных слов */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
        {hintWord && (
          <div className="bg-amber-500/10 dark:bg-amber-500/20 backdrop-blur-md p-4 rounded-2xl animate-pop shadow-lg border border-amber-500/20 dark:border-amber-500/30">
            <div className="text-[10px] font-black text-amber-600 dark:text-amber-300 uppercase tracking-widest mb-1">Подсказка</div>
            {hintActiveSeconds > 0 ? (
              <div className="text-sm font-bold italic text-gray-800 dark:text-white leading-relaxed">{isDefinitionLoading ? "Загрузка..." : hintDefinition}</div>
            ) : (
              <div className="text-3xl font-black text-center text-indigo-600 dark:text-white uppercase animate-bounce drop-shadow-md my-2">{hintWord}</div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 content-start">
          {foundWords.map((w, i) => (
            <div key={i} className="bg-white/60 dark:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg font-bold text-sm text-indigo-700 dark:text-white shadow-sm border border-white/40 dark:border-white/10 flex items-center gap-2 animate-pop">
              <span className={w.text.length >= 7 ? "text-amber-500" : ""}>{w.text.toUpperCase()}</span>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] px-1.5 rounded-md font-black">+{w.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Игровая панель */}
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur-xl p-4 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-30 border-t border-white/40 dark:border-white/10 shrink-0">
        {/* Бонусы */}
        <div className="mb-5 flex justify-around items-center">
          {[
            { icon: <Hourglass size={32} className="text-indigo-500 dark:text-indigo-400 drop-shadow-sm" />, count: bonusTimeLeft, action: handleAddTime, active: true },
            { icon: <Lightbulb size={32} className="text-amber-500 dark:text-amber-400 drop-shadow-sm" />, count: hintActiveSeconds > 0 ? `${hintActiveSeconds}c` : bonusHintLeft, action: handleHint, active: true, pulse: hintActiveSeconds > 0, ringClass: 'ring-amber-400/50' },
            { icon: <SquareAsterisk size={32} className="text-purple-500 dark:text-purple-400 drop-shadow-sm" />, count: wildcardActiveSeconds > 0 ? `${wildcardActiveSeconds}c` : bonusWildcardLeft, action: handleWildcard, active: wildcardActiveSeconds > 0, pulse: wildcardActiveSeconds > 0, ringClass: 'ring-purple-400/50' },
            { icon: <RefreshCw size={32} className="text-pink-500 dark:text-pink-400 drop-shadow-sm" />, count: bonusSwapLeft, action: toggleSwapMode, active: isSwapActive }
          ].map((btn, i) => {
            const isZero = typeof btn.count === 'number' && btn.count <= 0 && !btn.pulse;
            return (
              <button 
                key={i} 
                onClick={isZero ? (isDailyMode ? undefined : () => { playSfx('click'); onOpenShop(); }) : btn.action} 
                className={`relative flex flex-col items-center group transition-all ${isZero && isDailyMode ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95'}`}
                disabled={isZero && isDailyMode}
              >
                <div className={`w-14 h-14 bg-gradient-to-b from-white to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center border-2 border-white/50 shadow-xl ${btn.pulse ? `animate-pulse ring-4 ${btn.ringClass}` : ''}`}>
                  {btn.icon}
                </div>
                <span className={`mt-2 text-[10px] font-black px-2 py-0.5 rounded-full backdrop-blur-sm ${isZero && !isDailyMode ? 'bg-green-500 text-white' : 'bg-black/20 dark:bg-white/10 text-gray-800 dark:text-white'}`}>
                  {isZero ? (isDailyMode ? '0' : '+') : btn.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Поле ввода */}
        <div className="h-16 mb-4 bg-gray-100/50 dark:bg-black/20 rounded-2xl flex items-center justify-center relative px-12 shadow-inner border border-gray-200 dark:border-white/5">
          {currentInput.length > 0 && (
            <button onClick={() => { playSfx('click'); setCurrentInput([]); }} className="absolute left-2 p-2 text-gray-400 hover:text-red-400 transition-colors" title="Стереть все"><Trash2 size={24} /></button>
          )}
          <span className="text-3xl font-black tracking-[0.2em] text-indigo-600 dark:text-white uppercase truncate drop-shadow-md">
            {currentInput.join('') || <span className="opacity-30 text-lg font-normal normal-case italic text-gray-400 dark:text-white/20">Слово...</span>}
          </span>
          {currentInput.length > 0 && (
            <button onClick={() => { playSfx('click'); setCurrentInput(prev => prev.slice(0, -1)); }} className="absolute right-2 p-2 text-gray-400 hover:text-indigo-500 transition-colors"><Delete size={24} /></button>
          )}
        </div>

        {/* Сетка букв */}
        <div className={`grid ${grid.length === 10 ? 'grid-cols-5' : grid.length === 8 ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-4`}>
          {grid.map((letter, idx) => (
            <button key={idx} onClick={() => { if (isSwapActive) startSwap(idx); else { playSfx('click'); setCurrentInput(p => [...p, letter]); } }} className={`${grid.length === 10 ? 'aspect-square' : grid.length === 8 ? 'aspect-[5/4]' : 'aspect-[5/3]'} rounded-2xl font-black text-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg backdrop-blur-sm border-2 border-white/40 dark:border-white/10 ${hintIndices.has(idx) ? 'bg-amber-400 dark:bg-amber-500/80 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-white/60 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-white/80 dark:hover:bg-white/20'}`}>{letter}</button>
          ))}
        </div>

        {/* Кнопки управления */}
        <div className="flex gap-3">
          <button onClick={() => { playSfx('click'); setGrid([...grid].sort(() => Math.random() - 0.5)); }} className="flex-1 py-4 bg-gradient-to-b from-blue-400 to-blue-600 text-white font-black rounded-2xl active:scale-95 transition-all uppercase text-lg tracking-widest shadow-lg">Микс</button>
          <button onClick={checkWord} disabled={currentInput.length === 0} className={`flex-[2] py-4 font-black rounded-2xl transition-all uppercase text-lg tracking-widest shadow-lg ${currentInput.length > 0 ? 'bg-gradient-to-b from-green-400 to-green-600 text-white active:scale-95' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}`}>Ввод</button>
        </div>
      </div>

      {/* Тосты и модалки */}
      {message && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-bold text-white shadow-2xl z-[200] animate-bounce text-center backdrop-blur-md border border-white/20 ${message.type === 'good' ? 'bg-indigo-600/90' : 'bg-red-500/90'}`}>
          {message.text}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 w-full max-w-[280px] text-center shadow-2xl border border-white/20 animate-pop">
            <h3 className="font-bold mb-6 text-gray-900 dark:text-white text-lg">Завершить раунд?</h3>
            <div className="flex gap-3">
              <button onClick={() => { playSfx('click'); setShowConfirm(false); }} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold">Нет</button>
              <button onClick={() => { playSfx('click'); finishGame(); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/30">Да</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};