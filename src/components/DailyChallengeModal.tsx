import { useState } from 'react';
import { X, Zap, Calendar, CheckCircle, Info } from 'lucide-react';

interface DailyChallengeModalProps {
  onClose: () => void;
  onStart: (level: number) => void;
  playSfx: (sound: any) => void;
  completedLevels: number[];
  currentScore?: number;
}

export const DailyChallengeModal = ({ onClose, onStart, playSfx, completedLevels, currentScore = 0 }: DailyChallengeModalProps) => {
  const [infoLevel, setInfoLevel] = useState<number | null>(null);

  const getLevelInfo = (level: number) => {
      switch(level) {
          case 10: return { title: "Лёгкий уровень", desc: "Вам дается 10 букв. Идеально для разминки и поиска длинных слов.", mult: "x1" };
          case 8: return { title: "Средний уровень", desc: "Вам дается 8 букв. Баланс между сложностью и возможностями.", mult: "x1.5" };
          case 6: return { title: "Сложный уровень", desc: "Всего 6 букв. Только для настоящих эрудитов!", mult: "x2" };
          default: return { title: "", desc: "", mult: "" };
      }
  };

  return (
    <div className="modal-overlay z-[400]">
      {/* Info Modal */}
      {infoLevel && (
        <div className="modal-overlay z-[450]" onClick={() => setInfoLevel(null)}>
          <div className="modal-content max-w-xs" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-indigo-900 dark:text-white">{getLevelInfo(infoLevel).title}</h3>
              <button onClick={() => setInfoLevel(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed text-sm">
                {getLevelInfo(infoLevel).desc}
            </p>
            <div className="bg-indigo-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                <span className="text-xs uppercase font-bold opacity-60">Множитель очков</span>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{getLevelInfo(infoLevel).mult}</p>
            </div>
          </div>
        </div>
      )}

      <div className="modal-content max-w-sm">
        <div className="modal-header-container">
          <div className="modal-header-title-group">
            <Zap size={28} className="modal-header-icon text-amber-500" fill="currentColor" />
            <h2 className="modal-header-text">Испытание дня</h2>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
            <X size={24} className="modal-icon" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="daychallenge-bg">
            <div className="flex justify-between items-center mb-2">
              <div className="daychallenge-callendar">
                <Calendar size={14} />
                <span>Сегодня</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="daychallenge-points text-[10px] uppercase opacity-60">Ваши очки</span>
                 <span className="daychallenge-points text-xl leading-none">{currentScore}</span>
              </div>
            </div>
            <p className="daychallenge-info">
              В данном испытании, все участники находятся в равных условиях. У всех одинаковые наборы букв и по 1 бонусу каждого вида. Пройди все уровни, попади в тройку лидеров и получи награду!
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-center text-xs font-bold uppercase opacity-50 mb-2">Выбери сложность</p>
            
            {[
              { lvl: 10, label: "Лёгкий", mult: "( x 1 )", color: "daychallenge-easy-color", border: "daychallenge-easy-border", hover: "hover:bg-green-500/10" },
              { lvl: 8, label: "Средний", mult: "( x 1.5 )", color: "daychallenge-normal-color", border: "daychallenge-normal-border", hover: "hover:bg-blue-500/10" },
              { lvl: 6, label: "Сложный", mult: "( x 2 )", color: "daychallenge-hard-color", border: "daychallenge-hard-border", hover: "hover:bg-red-500/10" }
            ].map((item) => {
              const isDone = completedLevels.includes(item.lvl);
              return (
                <div key={item.lvl} className="relative">
                  <button 
                    onClick={() => !isDone && onStart(item.lvl)} 
                    disabled={isDone}
                    className={`daychallenge-button w-full
                      ${isDone 
                        ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400' 
                        : `${item.color} ${item.border} ${item.hover} active:scale-[0.98]`
                      }`}
                  >
                    <span className="uppercase">{item.label} <span className="normal-case opacity-60 ml-1">{item.mult}</span></span>
                    {isDone && <div className="flex items-center gap-1 text-green-500"><CheckCircle size={20} /> <span className="text-[10px]">Готово</span></div>}
                  </button>
                  {!isDone && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); playSfx('click'); setInfoLevel(item.lvl); }}
                        className="absolute top-0 right-0 h-full px-4 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                    >
                        <Info size={20} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};