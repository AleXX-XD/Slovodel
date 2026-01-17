import { useState } from 'react';
import { X, Info, Hourglass, Lightbulb, SquareAsterisk, RefreshCw, Plus, MessageCircle, Send, Check } from 'lucide-react';
import { getDictionary } from '../utils/dictionary';

interface AboutSectionProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
  bonuses: { time: number; hint: number; swap: number; wildcard: number };
  onOpenShop: () => void;
  showRanks?: boolean;
  onSubmitFeedback: (msg: string) => void;
  isDailyMode?: boolean;
}

export const AboutSection = ({ onClose, playSfx, bonuses, onOpenShop, onSubmitFeedback, showRanks = true, isDailyMode }: AboutSectionProps) => {
  const [feedback, setFeedback] = useState('');
  const [isSent, setIsSent] = useState(false);
  const wordCount = getDictionary()?.size || 0;

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    onSubmitFeedback(feedback);
    setFeedback('');
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  return (
    <div className="modal-overlay z-[300]">
      <div className="modal-content max-w-sm text-left flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <Info size={28} className="modal-header-icon" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Помощь</h2>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
            <X size={24} className="modal-icon" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="about-scroll-container">
          
          {/* Секция: Механика */}
          <section className="about-block">
            <h3 className="about-block-title">Суть игры</h3>
            <p className="text-sm opacity-90">Составляйте существительные из предложенных букв. Чем длиннее слово, тем больше очков! Раунд длится 60 секунд.</p>
            <p className="text-xs mt-2 opacity-60">В базе данных игры сейчас <span className="font-bold">{wordCount > 0 ? wordCount.toLocaleString('ru-RU') : '...'}</span> слов.</p>
          </section>

          {/* Секция: Подсказки */}
          <section className="space-y-3 mt-5">
            <h3 className="about-block-title">Бонусы:</h3>
            <div className="space-y-2">
              {[
                { icon: <Hourglass size={24} className="text-icon-indigo shrink-0" />, title: "Время", desc: "Добавляет 15 секунд к текущему раунду", count: bonuses.time, color: "text-title-indigo" },
                { icon: <Lightbulb size={24} className="text-icon-amber shrink-0" />, title: "Слово", desc: "Подсвечивает буквы для составления слова и дает его определение", count: bonuses.hint, color: "text-title-amber" },
                { icon: <SquareAsterisk size={24} className="text-icon-purple shrink-0" />, title: "Джокер", desc: "В течении 15 секунд «*» заменяет одну любую букву", count: bonuses.wildcard, color: "text-title-purple" },
                { icon: <RefreshCw size={24} className="text-icon-pink shrink-0" />, title: "Замена", desc: "Дает возможность заменить любую букву на поле", count: bonuses.swap, color: "text-title-pink" }
              ].map((h, i) => (
                <div key={i} className="hint-item">
                  {h.icon}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm uppercase truncate ${h.color}`}>{h.title}</p>
                    <p className="text-[10px] leading-tight opacity-70">{h.desc}</p>
                  </div>
                  <div className="bonus-count-badge">
                     <span className="font-bold text-sm">{h.count}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {isDailyMode ? (
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl border border-amber-500/20 text-center">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  В Испытании дня количество бонусов фиксировано.
                </p>
              </div>
            ) : (
              <button 
                onClick={() => { playSfx('click'); onOpenShop(); }}
                className="btn-action-indigo py-3 text-xs "
              >
                <Plus size={16} /> Получить бонусы
              </button>
            )}
          </section>

          {/* Секция: Звания */}
          {showRanks && (
            <section className="space-y-3">
              <h3 className="about-block-title mt-5">Звания эрудитов:</h3>
              <div className="grid grid-cols-1">
                {[
                  { rank: "Новичок-грамотей", points: "до 2 000", img: "./image/face.png" },
                  { rank: "Книжный червь", points: "от 2 000", img: "./image/worm_1.png" },
                  { rank: "Буквенный следопыт", points: "от 5 000", img: "./image/worm_1.png" },
                  { rank: "Словесный скаут", points: "от 10 000", img: "./image/wizard.png" },
                  { rank: "Адепт алфавита", points: "от 20 000", img: "./image/wizard.png" },
                  { rank: "Мастер слов", points: "от 50 000", img: "./image/wizard.png" },
                  { rank: "Магистр букв", points: "от 100 000", img: "./image/book_master_1.png" },
                  { rank: "Живая энциклопедия", points: "от 200 000", img: "./image/book_master_1.png" },
                  { rank: "Оракул Словодела", points: "от 500 000", img: "./image/book_master_1.png" }
                ].map((item, i) => (
                  <div key={i} className="rank-item">
                    <img src={item.img} alt={item.rank} className="w-8 h-8 object-contain" />
                    <div className="flex-1 min-w-0">
                      <p className="rank-title">{item.rank}</p>
                      <p className="text-[10px] font-bold opacity-50 uppercase">{item.points}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Секция: Обратная связь */}
          <section className="about-block">
            <h3 className="about-block-title mb-2">
              <MessageCircle size={16} /> Обратная связь
            </h3>
            <p className="text-xs mb-3 opacity-80">Нашли ошибку или хотите добавить слово? Напишите об этом нам 👇</p>
            {isSent ? (
              <div className="flex items-center justify-center gap-2 p-3 bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl font-bold text-sm animate-in fade-in zoom-in">
                <Check size={18} /> Отправлено!
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Сообщение..."
                  className="feedback-input"
                />
                <button 
                  onClick={() => { playSfx('click'); handleSendFeedback(); }} 
                  disabled={!feedback.trim()}
                  className={`feedback-send-btn ${!feedback.trim() ? 'feedback-send-btn-disabled' : 'feedback-send-btn-active'}`}
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </section>

        </div>

        {/* Footer */}
        <div className="mt-4 shrink-0">
           <div className="text-center opacity-30 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Created by @AleXX_4D
          </div>
        </div>

      </div>
    </div>
  );
};