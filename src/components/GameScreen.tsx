import { useState } from 'react';
import { formatTime } from '../utils/gameUtils';
import type { WordEntry } from '../types';
import { Delete, Trash2, Hourglass, Lightbulb, SquareAsterisk, RefreshCw, LogOut, Menu, Clock } from 'lucide-react';

interface GameScreenProps {
// ... existing props
  score: number;
  isDailyMode: boolean;
  isMarathonMode?: boolean;
  marathonSecondsAdded?: number;
  marathonSwapTarget?: number | null;
  timeLeft: number;
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
  hintRevealLeft: number;
  toggleSwapMode: () => void;
  bonusSwapLeft: number;
  isSwapActive: boolean;
  grid: string[];
  hintIndices: Record<number, number>;
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
    score, isDailyMode, isMarathonMode, marathonSecondsAdded, marathonSwapTarget, timeLeft, onOpenMenu, hintWord, isDefinitionLoading, hintDefinition,
    foundWords, currentInput, setCurrentInput, playSfx, handleAddTime, bonusTimeLeft,
    handleHint, bonusHintLeft, handleWildcard, bonusWildcardLeft, wildcardActiveSeconds,
    hintActiveSeconds, hintRevealLeft, toggleSwapMode, bonusSwapLeft, isSwapActive, grid, hintIndices, startSwap, checkWord,
    performSwap, swapTargetIdx, setSwapTargetIdx, showConfirm, setShowConfirm, finishGame, setGrid, onOpenShop
  } = props;

  const [swapSelectedChar, setSwapSelectedChar] = useState<string | null>(null);

  return (
    <div className="game-container">
      {/* Модалка замены */}
      {swapTargetIdx !== null && (
        <div className="modal-overlay z-[60]" onPointerDown={(e) => e.stopPropagation()}>
          <div className="modal-content w-[90%] max-w-sm pb-6">
            <h3 className="swap-modal-title mb-4">Выберите новую букву</h3>
            <div className="grid grid-cols-7 gap-2 mb-8">
              {"АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split('')
                .filter(char => !grid.includes(char))
                .map(char => (
                <button
                  key={char}
                  onClick={(e) => { 
                    e.stopPropagation();
                    playSfx('click'); 
                    setSwapSelectedChar(char);
                    setTimeout(() => {
                        performSwap(char);
                        setSwapSelectedChar(null);
                    }, 200);
                  }}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-200 ${
                    swapSelectedChar === char 
                      ? 'bg-indigo-600 text-white scale-110 shadow-lg ring-2 ring-indigo-300' 
                      : 'bg-gray-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-600'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); setSwapTargetIdx(null); }} 
                className="swap-modal-cancel-btn w-full py-3 text-sm"
            >
                Отмена
            </button>
          </div>
        </div>
      )}

      {/* Хедер */}
      <header className="game-header grid grid-cols-[1fr_auto] items-center gap-2">
        <div className="grid grid-cols-3 items-center flex-1 gap-1">
            {/* 1. Очки */}
            <div className="flex flex-col items-center justify-center">
                <div className="game-score">{score}</div>
                {isDailyMode && <div className="text-[8px] font-bold uppercase text-amber-500 tracking-wider leading-none">День</div>}
            </div>

            {/* 2. Таймер */}
            <div className="flex justify-center">
                <div className={`game-timer ${timeLeft < 10 ? 'game-timer-warning' : 'game-timer-normal'}`}>{formatTime(timeLeft)}</div>
            </div>

            {/* 3. Секунды (Марафон) или пусто */}
            <div className="flex justify-center">
                {isMarathonMode && (
                    <div className="bg-indigo-100 dark:bg-slate-700 px-2 py-1 rounded-lg flex items-center gap-1 text-indigo-600 dark:text-indigo-300 font-bold text-xs animate-in fade-in zoom-in whitespace-nowrap">
                        <Clock size={12} />
                        <span>+{marathonSecondsAdded || 0}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Кнопки меню (справа) */}
        <div className="flex gap-1 shrink-0">
          <button onClick={() => { playSfx('click'); onOpenMenu(); }} className="game-header-btn text-indigo-500"><Menu size={24} /></button>
          <button onClick={() => { playSfx('click'); setShowConfirm(true); }} className="game-header-btn text-red-500"><LogOut size={24} /></button>
        </div>
      </header>

      {/* Область найденных слов */}
      <div className="game-board-area">
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
        <div className="mb-2 flex justify-around items-center">
          {[
            { icon: <Hourglass size={32} className="text-icon-indigo bonus-icon-base" />, count: bonusTimeLeft, action: handleAddTime, active: true, id: 'time' },
            { icon: <Lightbulb size={32} className="text-icon-amber bonus-icon-base" />, count: hintActiveSeconds > 0 ? `${hintActiveSeconds}c` : bonusHintLeft, action: handleHint, active: true, pulse: hintActiveSeconds > 0, ringClass: 'ring-amber-400/50', id: 'hint' },
            { icon: <SquareAsterisk size={32} className="text-icon-purple bonus-icon-base" />, count: wildcardActiveSeconds > 0 ? `${wildcardActiveSeconds}c` : bonusWildcardLeft, action: handleWildcard, active: wildcardActiveSeconds > 0, pulse: wildcardActiveSeconds > 0, ringClass: 'ring-purple-400/50', id: 'wildcard' },
            { icon: <RefreshCw size={32} className="text-icon-pink bonus-icon-base" />, count: bonusSwapLeft, action: toggleSwapMode, active: isSwapActive, id: 'swap' }
          ].map((btn, i) => {
            const isZero = typeof btn.count === 'number' && btn.count <= 0 && !btn.pulse;
            // Disable logic: 
            // 1. If swap is active, disable everything except swap.
            // 2. If hint is active (seconds > 0), disable swap.
            const isHintActive = hintActiveSeconds > 0;
            
            let isDisabled = (isZero && isDailyMode);
            
            if (isSwapActive) {
                if (btn.id !== 'swap') isDisabled = true;
            } else if (isHintActive && btn.id === 'swap') {
                isDisabled = true;
            } else if (isMarathonMode && btn.id === 'time') {
                isDisabled = true;
            } else if (btn.id === 'swap' && marathonSwapTarget !== null) {
                // Блокируем "Замену" во время мигания буквы в марафоне
                isDisabled = true;
            }

            return (
              <button 
                key={i} 
                onClick={isDisabled ? undefined : (isZero ? (isDailyMode ? undefined : () => { playSfx('click'); onOpenShop(); }) : btn.action)} 
                className={`bonus-btn-wrapper ${isDisabled ? 'bonus-btn-disabled opacity-50 cursor-not-allowed' : 'bonus-btn-active'}`}
                disabled={isDisabled}
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

        {/* Подсказка (Слово) */}
        {hintWord && (hintActiveSeconds > 0 || hintRevealLeft > 0) && (
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/30 rounded-xl p-2 mb-3 text-center animate-in fade-in slide-in-from-top-1">
             <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
               {hintActiveSeconds > 0 ? "Подсказка" : "Загаданное слово"}
             </div>
             {hintActiveSeconds > 0 ? (
               <div className="text-sm font-medium text-gray-800 dark:text-gray-200 italic leading-snug">
                 {isDefinitionLoading ? "Загрузка..." : hintDefinition}
               </div>
             ) : (
               <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-widest animate-pulse">
                 {hintWord}
               </div>
             )}
          </div>
        )}
        
        {/* Если подсказка закончилась, но слово еще не угадано - показываем его (опционально, или убираем вовсе, как просил пользователь "показывать подсказку... между") 
            В оригинале было: если 0 секунд, показывалось слово. 
            Пользователь просил "показывать подсказку на панели". 
            Логика App.tsx: setHintWord(null) when seconds == 0 and revealLeft == 0.
            Но если revealLeft > 0, слово может быть еще активно.
            Оставим только отображение определения, когда hintActiveSeconds > 0.
        */}

        {/* Поле ввода */}
        <div className="input-field-container">
          <div 
            className={`input-text ${currentInput.length > 12 ? 'text-right' : 'text-center'}`}
            style={{ direction: currentInput.length > 12 ? 'rtl' : 'ltr' }}
          >
            {currentInput.length > 0 ? (
              <span style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
                {currentInput.join('')}
              </span>
            ) : (
              <span className="input-placeholder">Слово...</span>
            )}
          </div>
          {currentInput.length > 0 && (
            <button onClick={() => { playSfx('click'); setCurrentInput(prev => prev.slice(0, -1)); }} className="absolute right-2 p-2 input-field-element hover:text-indigo-500 transition-colors"><Delete size={24} /></button>
          )}
        </div>

        {/* Сетка букв */}
        <div className={`grid ${grid.length === 10 ? 'grid-cols-10-custom' : grid.length === 8 ? 'grid-cols-8-custom' : 'grid-cols-6-custom'} gap-2 mb-4`}>
          {grid.map((letter, idx) => {
            const count = hintIndices[idx] || 0;
            const hintClass = count > 1 ? 'letter-btn-hint-multi' : count === 1 ? 'letter-btn-hint' : '';
            const swapClass = isSwapActive ? 'ring-2 ring-inset ring-indigo-500' : '';
            const warningClass = marathonSwapTarget === idx ? 'marathon-warning' : '';
            
            return (
            <button 
              key={idx} 
              onPointerDown={(e) => {
                // Предотвращаем дефолтное поведение для тача, чтобы не было задержек/скролла
                if (e.pointerType === 'touch') {
                   // e.preventDefault(); 
                }
                if (isSwapActive) startSwap(idx); 
                else { 
                  playSfx('click'); 
                  setCurrentInput(p => [...p, letter]); 
                } 
              }} 
              className={`${grid.length === 10 ? 'aspect-10' : grid.length === 8 ? 'aspect-8' : 'aspect-6'} letter-btn ${hintClass} ${swapClass} ${warningClass}`}
            >
              {letter}
            </button>
          )})}
        </div>

        {/* Кнопки управления */}
        <div className="game-controls">
          <button 
            onClick={() => { playSfx('click'); setCurrentInput([]); }} 
            disabled={currentInput.length === 0}
            className={`aspect-square p-4 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              currentInput.length > 0 
                ? 'bg-red-100 text-red-500 active:scale-95 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-white/5 dark:text-gray-600'
            }`}
          >
            <Trash2 size={24} />
          </button>
          <button 
            onClick={() => { playSfx('click'); setGrid([...grid].sort(() => Math.random() - 0.5)); }} 
            disabled={marathonSwapTarget !== null}
            className={`btn-control-mix ${marathonSwapTarget !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Микс
          </button>
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