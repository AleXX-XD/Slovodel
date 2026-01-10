import { X, ShoppingBag } from 'lucide-react';

interface ShopModalProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
}

export const ShopModal = ({ onClose, playSfx }: ShopModalProps) => (
  <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-pop border border-white/20 relative">
      <div className="bg-white/50 dark:bg-white/5 p-6 text-gray-900 dark:text-white shrink-0 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Магазин
        </h2>
        <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="p-8 text-center">
        <p className="text-lg font-bold text-gray-800 dark:text-white mb-2">Скоро открытие!</p>
        <p className="text-sm opacity-60 text-gray-600 dark:text-gray-300">Здесь можно будет получить дополнительные подсказки и бонусы.</p>
      </div>
      <div className="p-4">
        <button onClick={() => { playSfx('click'); onClose(); }} className="w-full py-4 bg-white/60 dark:bg-white/20 backdrop-blur-md text-indigo-700 dark:text-white font-bold rounded-2xl border border-white/40 dark:border-white/20 active:scale-95 shadow-lg hover:bg-white/80 dark:hover:bg-white/30">Закрыть</button>
      </div>
    </div>
  </div>
);