import { useState } from 'react';
import { X, ShoppingBag, Hourglass, Lightbulb, RefreshCw, SquareAsterisk, Star, Minus, Plus } from 'lucide-react';

interface ShopModalProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
  coins: number;
  onBuyBonuses: (items: { type: 'time' | 'hint' | 'swap' | 'wildcard', cost: number, amount: number }[]) => boolean;
  initialTab?: 'bonuses' | 'coins';
}

export const ShopModal = ({ onClose, playSfx, coins, onBuyBonuses, initialTab = 'bonuses' }: ShopModalProps) => {
  const [activeTab, setActiveTab] = useState<'bonuses' | 'coins'>(initialTab);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQuantity = (id: string) => quantities[id] || 0;

  const updateQuantity = (id: string, delta: number) => {
    playSfx('click');
    setQuantities(prev => {
      const current = prev[id] || 0;
      const newValue = Math.max(0, Math.min(99, current + delta));
      return { ...prev, [id]: newValue };
    });
  };

  // Товары за монеты
  const bonusItems = [
    { id: 'time', name: 'Время', icon: <Hourglass size={24} className="text-indigo-500" />, cost: 30, type: 'time' as const },
    { id: 'swap', name: 'Замена', icon: <RefreshCw size={24} className="text-pink-500" />, cost: 40, type: 'swap' as const },
    { id: 'hint', name: 'Слово', icon: <Lightbulb size={24} className="text-amber-500" />, cost: 50, type: 'hint' as const },
    { id: 'wildcard', name: 'Джокер', icon: <SquareAsterisk size={24} className="text-purple-500" />, cost: 60, type: 'wildcard' as const },
  ];

  // Товары за реальные деньги (Telegram Stars)
  // В реальном приложении здесь нужно вызывать API для создания инвойса
  const coinPacks = [
    { id: 1, amount: 100, price: 50, label: 'Горсть' },
    { id: 2, amount: 250, price: 100, label: 'Мешочек' },
    { id: 3, amount: 500, price: 200, label: 'Сундук' },
    { id: 4, amount: 1000, price: 350, label: 'Сокровищница' },
    { id: 5, amount: 1500, price: 500, label: 'Гора золота' },
  ];

  const handleBuyCoins = (pack: any) => {
    playSfx('click');
    // Здесь должен быть вызов Telegram Invoice
    // window.Telegram.WebApp.openInvoice(invoiceUrl);
    alert(`В будущем здесь откроется оплата ${pack.price} Telegram Stars за ${pack.amount} словокоинов.`);
  };

  const totalCost = bonusItems.reduce((acc, item) => acc + (item.cost * getQuantity(item.id)), 0);
  const totalCount = bonusItems.reduce((acc, item) => acc + getQuantity(item.id), 0);

  const handleBuy = () => {
    if (totalCount === 0) return;
    
    const items = bonusItems.map(item => ({
        type: item.type,
        cost: item.cost * getQuantity(item.id),
        amount: getQuantity(item.id)
    })).filter(i => i.amount > 0);
    
    if (onBuyBonuses(items)) {
      setQuantities({});
    }
  };

  return (
    <div className="modal-overlay z-[400]">
      <div className="modal-content max-w-sm h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingBag size={28} className="modal-header-icon" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Магазин</h2>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
            <X size={24} className="modal-icon" />
          </button>
        </div>

        {/* Баланс */}
        <div className="shop-balance-card">
          <span className="shop-balance-label">Ваш баланс</span>
          <div className="flex items-center gap-2">
            <img src="./image/coin.svg" alt="coin" className="w-8 h-8 object-contain" />
            <span className="shop-balance-value">{coins}</span>
          </div>
        </div>

        {/* Табы */}
        <div className="tabs-group mb-4 shrink-0">
          <button onClick={() => { playSfx('click'); setActiveTab('bonuses'); }} className={`tab-item ${activeTab === 'bonuses' ? 'tab-item-active' : ''}`}>
            ✨ Бонусы
          </button>
          <button onClick={() => { playSfx('click'); setActiveTab('coins'); }} className={`tab-item ${activeTab === 'coins' ? 'tab-item-active' : ''}`}>
            💰 Словокоины
          </button>
        </div>

        <div className="shop-list-container">
          {activeTab === 'bonuses' ? (
            <>
              {bonusItems.map((item) => {
                const count = getQuantity(item.id);
                return (
                  <div key={item.id} className="shop-item-card !flex-col !items-stretch !h-auto gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="shop-item-icon-bg">{item.icon}</div>
                        <div>
                          <p className="shop-item-title">{item.name}</p>
                          <p className="shop-item-cost flex items-center">
                            <img src="./image/coin.svg" alt="C" className="w-3 h-3 mr-1" />
                            {item.cost}
                          </p>
                        </div>
                      </div>
                      {/* Контрол количества */}
                      <div className="shop-item-control">
                          <button onClick={() => updateQuantity(item.id, -1)} className="shop-item-control-plus"><Minus size={14}/></button>
                          <span className="shop-item-control-count ">{count}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="shop-item-control-plus"><Plus size={14}/></button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="shop-item-info">
                Бонусы можно получить в качестве наград за дневные испытания, повышение ранга, нахождение редких слов и регулярное посещение игры.
              </p>
            </>
          ) : (
            coinPacks.map((pack) => (
              <div key={pack.id} className="coin-pack-card">
                <div className="relative z-10 text-left">
                  <p className="coin-pack-amount flex items-center gap-1">
                    <img src="./image/coin.svg" alt="c" className="w-5 h-5" />
                    {pack.amount}
                  </p>
                  <p className="coin-pack-label">{pack.label}</p>
                </div>
                <button onClick={() => handleBuyCoins(pack)} className="coin-pack-btn">
                  {pack.price} <Star size={12} fill="currentColor" />
                </button>
                <img src="./image/coin.svg" className="coin-pack-bg-icon w-16 h-16" />
              </div>
            ))
          )}
        </div>

        {activeTab === 'bonuses' && (
          <div className="p-4 border-t border-gray-200 dark:border-white/10 mt-auto">
            <button 
              onClick={handleBuy}
              disabled={totalCount === 0}
              className={`shop-footer-btn ${totalCount > 0 ? 'shop-footer-btn-active' : 'shop-footer-btn-disabled'}`}
            >
              <span>{totalCount > 0 ? `Купить за ${totalCost}` : 'Выберите бонусы'}</span>
              {totalCount > 0 && <img src="./image/coin.svg" className="w-6 h-6" />}
            </button>
          </div>
        )}
      </div>
    </div>
);
}