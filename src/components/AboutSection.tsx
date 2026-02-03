import { useState } from 'react';
import { X, Menu, Hourglass, Lightbulb, SquareAsterisk, RefreshCw, Plus, MessageCircle, Send, Check, Book, Search, Volume2, Music, Sun, Moon, Shield } from 'lucide-react';
import { getDictionary } from '../utils/dictionary';
import { apiClient } from '../utils/apiClient';

interface AboutSectionProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
  bonuses: { time: number; hint: number; swap: number; wildcard: number };
  onOpenShop: () => void;
  onSubmitFeedback: (data: any) => void;
  isDailyMode?: boolean;
  isMarathonMode?: boolean;
  isGameActive?: boolean;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
}

export const AboutSection = ({
  onClose, playSfx, bonuses, onOpenShop, onSubmitFeedback, isDailyMode, isMarathonMode, isGameActive,
  musicVolume, setMusicVolume, sfxVolume, setSfxVolume, theme, setTheme, isAdmin, onOpenAdmin
}: AboutSectionProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'dict' | 'feedback'>('info');
  const [feedback, setFeedback] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const [searchResult, setSearchResult] = useState<{ word: string, def: string | null } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const wordCount = getDictionary()?.size || 0;

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    onSubmitFeedback({ message: feedback });
    setFeedback('');
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  const handleSearch = async () => {
    if (!searchWord.trim()) return;
    setIsSearching(true);
    const cleanWord = searchWord.trim().toLowerCase().replace(/ё/g, 'е');
    const dictionary = getDictionary();
    
    if (dictionary && dictionary.has(cleanWord)) {
      try {
        const res = await apiClient.searchWord(cleanWord);
        setSearchResult({ 
            word: cleanWord, 
            def: res?.definition || "Определение отсутствует." 
        });
      } catch (e) {
        setSearchResult({ word: cleanWord, def: "Не удалось загрузить определение." });
      }
    } else {
      setSearchResult({ word: cleanWord, def: null });
    }
    setIsSearching(false);
  };

  const toggleMusic = () => {
    playSfx('click');
    setMusicVolume(musicVolume > 0 ? 0 : 0.3);
  };

  const toggleSfx = () => {
    playSfx('click');
    setSfxVolume(sfxVolume > 0 ? 0 : 0.5);
  };

  const toggleTheme = () => {
    playSfx('click');
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="modal-overlay z-[300] items-center">
      <div className="modal-content max-w-sm text-left flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-white/10 shrink-0 bg-white dark:bg-slate-900 z-10 rounded-t-3xl">
          <div className="flex justify-between items-center w-full mb-3">
            <div className="modal-header-title-group">
              <Menu size={28} className="modal-header-icon" />
              <h2 className="modal-header-text">Меню</h2>
            </div>
            <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
              <X size={24} className="modal-icon" />
            </button>
          </div>

          {/* Settings Row */}
          <div className="flex justify-between items-center mb-3 px-1">
            {/* Sound */}
            <button onClick={toggleSfx} className="flex flex-col items-center gap-1 min-w-[60px]">
               <div className={`p-2 rounded-full transition-colors ${sfxVolume > 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-gray-500'}`}>
                 <Volume2 size={20} />
               </div>
               <span className="text-[10px] font-bold uppercase opacity-70">Звуки</span>
            </button>
            
            {/* Music */}
            <button onClick={toggleMusic} className="flex flex-col items-center gap-1 min-w-[60px]">
               <div className={`p-2 rounded-full transition-colors ${musicVolume > 0 ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-gray-500'}`}>
                 <Music size={20} />
               </div>
               <span className="text-[10px] font-bold uppercase opacity-70">Музыка</span>
            </button>

            {/* Theme */}
            <button onClick={toggleTheme} className="flex flex-col items-center gap-1 min-w-[60px]">
               <div className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-amber-100 text-amber-600'}`}>
                 {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
               </div>
               <span className="text-[10px] font-bold uppercase opacity-70">Тема</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
            <button 
              onClick={() => { playSfx('click'); setActiveTab('info'); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'info' ? 'bg-white shadow text-indigo-600 dark:bg-slate-700 dark:text-white' : 'text-gray-500 hover:bg-black/5 dark:text-gray-400'}`}
            >
              Об игре
            </button>
            <button 
              onClick={() => { playSfx('click'); setActiveTab('dict'); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'dict' ? 'bg-white shadow text-indigo-600 dark:bg-slate-700 dark:text-white' : 'text-gray-500 hover:bg-black/5 dark:text-gray-400'}`}
            >
              Словарь
            </button>
            <button 
              onClick={() => { playSfx('click'); setActiveTab('feedback'); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'feedback' ? 'bg-white shadow text-indigo-600 dark:bg-slate-700 dark:text-white' : 'text-gray-500 hover:bg-black/5 dark:text-gray-400'}`}
            >
              Связь
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="about-scroll-container pt-2">
          
          {/* TAB: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-5 animate-fade-in px-4">
              <section className="about-block">
                <h3 className="about-block-title">Суть игры</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {!isGameActive ? (
                    "Составляйте существительные из предложенных букв. Чем длиннее слово, тем больше очков! Буквы можно использовать несколько раз. Принимайте участие в ежедневных испытаниях, получайте награды и поднимайтесь в рейтинге лучших эрудитов."
                  ) : isMarathonMode ? (
                    "Составляйте существительные из предложенных букв. Буквы можно использовать несколько раз. Каждое угаданное слово добавляет время (1 буква = 1 секунда). Будьте внимательны: каждые 30 секунд одна буква на поле меняется!"
                  ) : (
                    "Составляйте существительные из предложенных букв. Чем длиннее слово, тем больше очков! Буквы можно использовать несколько раз."
                  )}
                </p>
              </section>
              <section className="space-y-3">
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
                  <div className="daily-bonus-notice">
                    <p className="daily-bonus-text">
                      В Испытании дня количество бонусов фиксировано.
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={() => { playSfx('click'); onOpenShop(); }}
                    className="btn-action-indigo py-3 text-xs w-full"
                  >
                    <Plus size={16} /> Получить бонусы
                  </button>
                )}
              </section>
            </div>
          )}

          {/* TAB: DICTIONARY */}
          {activeTab === 'dict' && (
            <div className="space-y-4 animate-fade-in">
              <section className="about-block bg-indigo-50 dark:bg-slate-800 border-indigo-100 dark:border-slate-700 py-2">
                <div className="flex flex-row items-center justify-center gap-3">
                  <Book size={24} className="text-indigo-400 opacity-50" />
                  <div className="text-center">
                    <h3 className="text-sm font-black text-indigo-900 dark:text-white uppercase leading-none">Толковый словарь</h3>
                    <p className="text-[10px] opacity-60 leading-none mt-1">Всего слов: <span className="font-bold text-indigo-600 dark:text-indigo-400">{wordCount > 0 ? wordCount.toLocaleString('ru-RU') : '...'}</span></p>
                  </div>
                </div>
              </section>

              <section className="about-block">
                <h3 className="about-block-title mb-2">Поиск слова</h3>
                <div className="flex gap-2 h-12 w-full">
                  <input 
                    type="text" 
                    value={searchWord}
                    onChange={(e) => setSearchWord(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                        (e.target as HTMLElement).blur(); 
                      }
                    }}
                    placeholder="Введите слово..."
                    className="flex-1 min-w-0 bg-gray-100 dark:bg-slate-900 border-none rounded-xl px-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button 
                    onClick={() => { 
                      playSfx('click'); 
                      handleSearch(); 
                      (document.activeElement as HTMLElement)?.blur(); 
                    }}
                    disabled={isSearching}
                    className="bg-indigo-600 text-white rounded-xl w-12 h-12 flex items-center justify-center hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    {isSearching ? <div className="spinner w-5 h-5 border-2 border-white rounded-full animate-spin"></div> : <Search size={20} />}
                  </button>
                </div>

                {searchResult && (
                  <div className={`mt-4 p-4 rounded-xl border-2 ${searchResult.def !== null ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800'}`}>
                    <p className="font-bold text-lg mb-1 capitalize">{searchResult.word}</p>
                    {searchResult.def ? (
                      <p className="text-sm opacity-80 leading-relaxed">{searchResult.def}</p>
                    ) : (
                      <div className="text-sm opacity-80">
                        <p>Слово не найдено в словаре игры.</p>
                        <p className="text-xs mt-2 opacity-60">Если вы уверены, что такое слово существует, напишите нам во вкладке «Связь».</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB: FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="space-y-5 animate-fade-in pb-8">
              <section className="about-block bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30">
                <div className="flex items-start gap-3">
                  <MessageCircle size={24} className="text-amber-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 text-sm mb-1">Мы на связи!</h3>
                    <p className="text-xs text-amber-800/70 dark:text-amber-200/70 leading-relaxed">
                      Нашли ошибку? Хотите предложить новое слово или идею? Напишите нам, мы читаем все сообщения.
                    </p>
                  </div>
                </div>
              </section>

              <section className="about-block">
                <h3 className="about-block-title mb-2">Ваше сообщение</h3>
                <div className="relative">
                  <textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Напишите здесь..."
                    className="w-full bg-gray-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm min-h-[120px] resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="absolute bottom-3 right-3">
                    {isSent ? (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-lg shadow-sm animate-bounce">
                        <Check size={14} /> Отправлено
                      </div>
                    ) : (
                      <button 
                        onClick={() => { playSfx('click'); handleSendFeedback(); }} 
                        disabled={!feedback.trim()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${!feedback.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'}`}
                      >
                        Отправить <Send size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </section>
              
              {isAdmin && onOpenAdmin && (
                <div className="flex justify-center mt-6">
                  <button onClick={() => { playSfx('click'); onOpenAdmin(); }} className="btn-action-indigo flex items-center gap-2 text-xs py-2 px-4 bg-slate-800 text-white">
                    <Shield size={14} /> Панель администратора
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-4 shrink-0 border-t border-gray-100 dark:border-white/10 pt-4">
           <div className="creator-footer">
            Created by @AleXX_4D
          </div>
        </div>

      </div>
    </div>
  );
};