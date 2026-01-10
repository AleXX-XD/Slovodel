import { X, Zap, Calendar, CheckCircle } from 'lucide-react';

interface DailyChallengeModalProps {
  onClose: () => void;
  onStart: (level: number) => void;
  playSfx: (sound: any) => void;
  completedLevels: number[];
}

export const DailyChallengeModal = ({ onClose, onStart, playSfx, completedLevels }: DailyChallengeModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-pop border border-white/20 relative">
        <div className="bg-white/50 dark:bg-white/5 p-6 text-gray-900 dark:text-white shrink-0 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" fill="currentColor" />
            Испытание дня
          </h2>
          <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-amber-500/10 dark:bg-amber-500/20 p-4 rounded-2xl border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300 font-bold uppercase text-xs tracking-wider">
              <Calendar size={14} />
              <span>Сегодня</span>
            </div>
            <p className="text-sm text-gray-800 dark:text-white opacity-80">
              Пройдите все 3 уровня сложности, чтобы попасть в рейтинг! Для прохождения вам доступно по 2 подсказки каждого вида.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-center text-xs font-bold uppercase opacity-50 mb-2">Выберите сложность</p>
            
            {[
              { lvl: 10, label: "Лёгкий", mult: "x1", color: "text-green-600 dark:text-green-300", border: "border-green-500/20 dark:border-green-400/30", hover: "hover:bg-green-500/10 dark:hover:bg-green-400/20" },
              { lvl: 8, label: "Средний", mult: "x1.5", color: "text-blue-600 dark:text-blue-300", border: "border-blue-500/20 dark:border-blue-400/30", hover: "hover:bg-blue-500/10 dark:hover:bg-blue-400/20" },
              { lvl: 6, label: "Сложный", mult: "x2", color: "text-red-600 dark:text-red-300", border: "border-red-500/20 dark:border-red-400/30", hover: "hover:bg-red-500/10 dark:hover:bg-red-400/20" }
            ].map((item) => {
              const isDone = completedLevels.includes(item.lvl);
              return (
                <button 
                  key={item.lvl}
                  onClick={() => !isDone && onStart(item.lvl)} 
                  disabled={isDone}
                  className={`w-full py-4 bg-white/60 dark:bg-white/10 backdrop-blur-sm font-black rounded-2xl border shadow-lg transition-all uppercase text-sm flex items-center justify-between px-6
                    ${isDone 
                      ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-white/10 text-gray-400' 
                      : `${item.color} ${item.border} ${item.hover} active:scale-[0.98]`
                    }`}
                >
                  <span>{item.label} <span className="opacity-60 text-[10px] ml-1">{item.mult}</span></span>
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