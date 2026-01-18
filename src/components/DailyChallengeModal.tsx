import { X, Zap, Calendar, CheckCircle } from 'lucide-react';

interface DailyChallengeModalProps {
  onClose: () => void;
  onStart: (level: number) => void;
  playSfx: (sound: any) => void;
  completedLevels: number[];
  currentScore?: number;
}

export const DailyChallengeModal = ({ onClose, onStart, playSfx, completedLevels, currentScore = 0 }: DailyChallengeModalProps) => {
  return (
    <div className="modal-overlay z-[400]">
      <div className="modal-content max-w-sm">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <Zap size={28} className="modal-header-icon text-amber-500" fill="currentColor" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Испытание дня</h2>
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
                <button 
                  key={item.lvl}
                  onClick={() => !isDone && onStart(item.lvl)} 
                  disabled={isDone}
                  className={`daychallenge-button
                    ${isDone 
                      ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400' 
                      : `${item.color} ${item.border} ${item.hover} active:scale-[0.98]`
                    }`}
                >
                  <span className="uppercase">{item.label} <span className="normal-case opacity-60 ml-1">{item.mult}</span></span>
                  {isDone && <div className="flex items-center gap-1 text-green-500"><CheckCircle size={20} /> <span className="text-[10px]">Готово</span></div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};