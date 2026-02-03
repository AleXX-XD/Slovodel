import { Flame, X, Calendar, Clock } from 'lucide-react';

interface StreakInfoModalProps {
  streak: number;
  onClose: () => void;
  playSfx: (sound: any) => void;
}

export const StreakInfoModal = ({ streak, onClose, playSfx }: StreakInfoModalProps) => {
  return (
    <div className="modal-overlay z-[110]" onClick={() => { playSfx('click'); onClose(); }}>
      <div className="modal-content max-w-xs text-center" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                <Flame fill="currentColor" /> Ударный режим
            </h3>
            <button onClick={() => { playSfx('click'); onClose(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
            </button>
        </div>
        
        <div className="streak-stat-box">
            <p className="text-4xl font-black text-orange-500 mb-1">{streak}</p>
            <p className="text-xs font-bold uppercase text-orange-400 tracking-widest">Дней подряд</p>
        </div>

        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 text-left">
            <div className="streak-list-item">
                <Calendar className="shrink-0 text-indigo-500" size={20} />
                <p>Заходите в игру каждый день, чтобы увеличивать свою серию.</p>
            </div>
            <div className="streak-list-item">
                <Clock className="shrink-0 text-indigo-500" size={20} />
                <p>Если пропустить хотя бы один день, серия сбросится до нуля!</p>
            </div>
             <div className="streak-list-item">
                <div className="shrink-0 text-xl">🎁</div>
                <p>Получайте особые награды за достижение: 3, 7, 14 и 30 дней серии!</p>
            </div>
        </div>

        <button 
            onClick={() => { playSfx('click'); onClose(); }}
            className="streak-btn"
        >
            Понятно
        </button>
      </div>
    </div>
  );
};
