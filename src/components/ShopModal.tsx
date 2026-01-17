import { X, ShoppingBag } from 'lucide-react';

interface ShopModalProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
}

export const ShopModal = ({ onClose, playSfx }: ShopModalProps) => (
  <div className="modal-overlay z-[400]">
    <div className="modal-content max-w-sm">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <ShoppingBag size={28} className="modal-header-icon" />
          <h2 className="text-xl font-bold uppercase tracking-tight">Магазин</h2>
        </div>
        <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
          <X size={24} className="modal-icon" />
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