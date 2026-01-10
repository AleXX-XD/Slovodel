//Помощь
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
  <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-pop border border-white/20 h-[85vh] relative">
      
      {/* Header */}
      <div className="bg-white/50 dark:bg-white/5 p-6 text-gray-900 dark:text-white shrink-0 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Помощь
          </h2>
          <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 leading-relaxed text-gray-900 dark:text-white">
        
        {/* Секция: Механика */}
        <section className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/20">
          <h3 className="font-black text-indigo-600 dark:text-indigo-300 uppercase text-sm mb-2">Суть игры</h3>
          <p className="text-sm">Составляйте существительные из предложенных букв. Чем длиннее слово, тем больше очков! Раунд длится 60 секунд.</p>
          <p className="text-xs mt-2 opacity-70">В базе данных игры сейчас <span className="font-bold">{wordCount > 0 ? wordCount.toLocaleString('ru-RU') : '...'}</span> слов.</p>
        </section>

        {/* Секция: Подсказки */}
        <section className="space-y-3">
          <h3 className="font-black opacity-60 uppercase text-xs">Подсказки:</h3>
          <div className="space-y-2">
            {[
              { icon: <Hourglass size={24} className="text-indigo-500 dark:text-indigo-400 shrink-0" />, title: "Время", desc: "Добавляет +15 секунд к текущему раунду.", count: bonuses.time, color: "text-indigo-600 dark:text-indigo-300" },
              { icon: <Lightbulb size={24} className="text-amber-500 dark:text-amber-400 shrink-0" />, title: "Слово", desc: "Показывает скрытое слово на 30 секунд, его значение и подсвечивает нужные буквы.", count: bonuses.hint, color: "text-amber-600 dark:text-amber-300" },
              { icon: <SquareAsterisk size={24} className="text-purple-500 dark:text-purple-400 shrink-0" />, title: "Джокер", desc: "На 15 секунд дает возможность использовать любую букву вместо «*».", count: bonuses.wildcard, color: "text-purple-600 dark:text-purple-300" },
              { icon: <RefreshCw size={24} className="text-pink-500 dark:text-pink-400 shrink-0" />, title: "Замена", desc: "Позволяет заменить любую одну букву на поле на ту, которую выберешь ты.", count: bonuses.swap, color: "text-pink-600 dark:text-pink-300" }
            ].map((h, i) => (
              <div key={i} className="p-3 bg-white/40 dark:bg-white/5 rounded-xl border border-white/10 flex gap-3 items-center">
                {h.icon}
                <div className="flex-1">
                  <p className={`font-bold text-sm uppercase ${h.color}`}>{h.title}</p>
                  <p className="text-xs opacity-70">{h.desc}</p>
                </div>
                <div className="flex flex-col items-center bg-white/50 dark:bg-black/20 rounded-lg px-2 py-1 min-w-[40px]">
                   <span className="font-black text-sm">{h.count}</span>
                </div>
              </div>
            ))}
          </div>
          {isDailyMode ? (
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl border border-amber-500/20 text-center">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                В Испытании дня количество подсказок фиксировано.
              </p>
            </div>
          ) : (
            <button 
              onClick={() => { playSfx('click'); onOpenShop(); }}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all uppercase text-sm flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Получить подсказки
            </button>
          )}
        </section>

        {/* Секция: Звания */}
        {showRanks && (
          <section className="space-y-3">
            <h3 className="font-black opacity-60 uppercase text-xs">Звания эрудитов (по общим очкам):</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { rank: "Новичок-грамотей", points: "до 2 000", img: "./image/face.png" },
                { rank: "Книжный червь", points: "от 2 000", img: "./image/worm_1.png" },
                { rank: "Буквенный следопыт", points: "от 5 000", img: "./image/worm_1.png" },
                { rank: "Словесный скаут", points: "от 10 000", img: "./image/wizard.png" },
                { rank: "Мастер слов", points: "от 50 000", img: "./image/wizard.png" },
                { rank: "Магистр букв", points: "от 100 000", img: "./image/book_master_1.png" },
                { rank: "Живая энциклопедия", points: "от 200 000", img: "./image/book_master_1.png" },
                { rank: "Оракул Словодела", points: "от 500 000", img: "./image/book_master_1.png" }
              ].map((item, i) => (
                <div key={i} className="p-3 bg-white/40 dark:bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                  <img src={item.img} alt={item.rank} className="w-10 h-10 object-contain" />
                  <div className="flex-1">
                    <p className="font-bold text-indigo-600 dark:text-indigo-300 text-sm">{item.rank}</p>
                    <p className="text-[10px] font-black opacity-50 uppercase">{item.points}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Секция: Обратная связь */}
        <section className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/20">
          <h3 className="font-black text-indigo-600 dark:text-indigo-300 uppercase text-sm mb-2 flex items-center gap-2">
            <MessageCircle size={16} /> Обратная связь
          </h3>
          <p className="text-xs mb-3 opacity-80">Нашли ошибку или хотите добавить слово? Напишите нам:</p>
          {isSent ? (
            <div className="flex items-center justify-center gap-2 p-3 bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl font-bold text-sm animate-in fade-in zoom-in">
              <Check size={18} /> Спасибо за обратную связь!
            </div>
          ) : (
            <div className="flex gap-2">
              <input 
                type="text" 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ваше сообщение..."
                className="flex-1 bg-white/50 dark:bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors text-gray-900 dark:text-white placeholder:text-gray-500"
              />
              <button 
                onClick={() => { playSfx('click'); handleSendFeedback(); }} 
                disabled={!feedback.trim()}
                className={`p-2 rounded-xl transition-colors active:scale-95 ${!feedback.trim() ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </section>
      </div>

      <div className="p-4 shrink-0">
        <button onClick={() => { playSfx('click'); onClose(); }} className="w-full py-4 bg-white/60 dark:bg-white/20 backdrop-blur-md text-indigo-700 dark:text-white font-bold rounded-2xl border border-white/40 dark:border-white/20 active:scale-95 shadow-lg hover:bg-white/80 dark:hover:bg-white/30">Закрыть</button>
      </div>
    </div>
  </div>
  );
};