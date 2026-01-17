import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, MessageCircle, BookPlus, Send, Check, Trash2, Edit2, Save, Search, Reply, Archive, Megaphone, X, Eye } from 'lucide-react';
import { getDictionary } from '../utils/dictionary';

interface AdminPanelModalProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
  fetchFeedbacks: () => Promise<any[]>;
  addCustomWord: (word: string) => Promise<boolean>;
  fetchAdminCustomWords: () => Promise<any[]>;
  deleteCustomWord: (id: number) => Promise<boolean>;
  updateCustomWord: (id: number, word: string) => Promise<boolean>;
  onReply: (feedbackId: number, telegramId: number, text: string) => Promise<boolean>;
  onArchive: (id: number) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onBroadcast: (message: string) => Promise<boolean>;
  onTestModal: (type: string) => void;
}

export const AdminPanelModal = ({ onClose, playSfx, fetchFeedbacks, addCustomWord, fetchAdminCustomWords, deleteCustomWord, updateCustomWord, onReply, onArchive, onDelete, onBroadcast, onTestModal }: AdminPanelModalProps) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'dictionary' | 'broadcast' | 'testing'>('feedback');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [customWords, setCustomWords] = useState<any[]>([]);
  const [newWord, setNewWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wordStatus, setWordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'new' | 'replied' | 'archived'>('all');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'feedback') {
      setIsLoading(true);
      fetchFeedbacks().then(data => {
        setFeedbacks(data);
        setIsLoading(false);
      });
    } else if (activeTab === 'dictionary') {
      setIsLoading(true);
      fetchAdminCustomWords().then(data => {
        setCustomWords(data);
        setIsLoading(false);
      });
    }
  }, [activeTab, fetchFeedbacks, fetchAdminCustomWords]);

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    const word = newWord.trim().toLowerCase();
    
    const dict = getDictionary();
    if (dict && dict.has(word)) {
      alert('Это слово уже есть в словаре!');
      return;
    }

    const success = await addCustomWord(word);
    if (success) {
      dict?.add(word); // Добавляем в текущий кэш, чтобы работало сразу
      setNewWord('');
      setWordStatus('success');
      setTimeout(() => setWordStatus('idle'), 2000);
      fetchAdminCustomWords().then(setCustomWords); // Обновляем список
    } else {
      setWordStatus('error');
    }
  };

  const handleDeleteWord = async (id: number, word: string) => {
    if (window.confirm(`Удалить слово "${word}"?`)) {
      const success = await deleteCustomWord(id);
      if (success) {
        const dict = getDictionary();
        dict?.delete(word);
        setCustomWords(prev => prev.filter(w => w.id !== id));
      }
    }
  };

  const startEdit = (wordObj: any) => {
    setEditingId(wordObj.id);
    setEditValue(wordObj.word);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (id: number, oldWord: string) => {
    const trimmed = editValue.trim().toLowerCase();
    if (!trimmed || trimmed === oldWord) {
      cancelEdit();
      return;
    }
    
    const success = await updateCustomWord(id, trimmed);
    if (success) {
      const dict = getDictionary();
      dict?.delete(oldWord);
      dict?.add(trimmed);
      setCustomWords(prev => prev.map(w => w.id === id ? { ...w, word: trimmed } : w));
      cancelEdit();
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const dict = getDictionary();
    const word = searchQuery.trim().toLowerCase().replace(/ё/g, 'е');
    if (dict && dict.has(word)) {
      setSearchResult('found');
    } else {
      setSearchResult('not-found');
    }
  };

  // Фильтрация списка слов по поисковому запросу
  const filteredCustomWords = customWords.filter(item => 
    item.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeedbacks = feedbacks.filter(fb => {
    if (feedbackFilter === 'archived') return fb.status === 'archived';
    if (fb.status === 'archived') return false; // Скрываем архивные из других вкладок

    if (feedbackFilter === 'new') return fb.status !== 'replied';
    if (feedbackFilter === 'replied') return fb.status === 'replied';
    return true;
  });

  const handleSendReply = async (fb: any) => {
    if (!replyText.trim()) return;
    const success = await onReply(fb.id, fb.telegram_id, replyText);
    if (success) {
      setReplyingId(null);
      setReplyText('');
      // Обновляем список
      fetchFeedbacks().then(setFeedbacks);
    } else {
      alert('Ошибка отправки ответа');
    }
  };

  const handleArchive = async (id: number) => {
    if (await onArchive(id)) {
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: 'archived' } : f));
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Удалить отзыв навсегда?')) {
      if (await onDelete(id)) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
      }
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    if (window.confirm('Вы уверены, что хотите отправить это сообщение ВСЕМ игрокам?')) {
      const success = await onBroadcast(broadcastMessage);
      if (success) {
        setBroadcastMessage('');
        alert('Рассылка поставлена в очередь!');
      } else {
        alert('Ошибка создания рассылки');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900 animate-in fade-in duration-300">
      <div className="flex flex-col h-full p-4">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <Shield size={28} className="modal-header-icon" />
            <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900 dark:text-white">Админка</h2>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 bg-white/70 dark:bg-white/10 rounded-xl hover:bg-black/10 transition-colors">
            <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
          </button>
        </div>
          
        <div className="tabs-group mb-4 shrink-0">
            <button onClick={() => setActiveTab('feedback')} className={`tab-item ${activeTab === 'feedback' ? 'tab-item-active' : ''}`}>
              <MessageCircle size={16} /> Отзывы
            </button>
            <button onClick={() => setActiveTab('dictionary')} className={`tab-item ${activeTab === 'dictionary' ? 'tab-item-active' : ''}`}>
              <BookPlus size={16} /> Словарь
            </button>
            <button onClick={() => setActiveTab('broadcast')} className={`tab-item ${activeTab === 'broadcast' ? 'tab-item-active' : ''}`}>
              <Megaphone size={16} /> Рассылка
            </button>
            <button onClick={() => setActiveTab('testing')} className={`tab-item ${activeTab === 'testing' ? 'tab-item-active' : ''}`}>
              <Eye size={16} /> UI Тест
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'feedback' ? (
            <>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button onClick={() => setFeedbackFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${feedbackFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                Все
              </button>
              <button onClick={() => setFeedbackFilter('new')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${feedbackFilter === 'new' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                Новые
              </button>
              <button onClick={() => setFeedbackFilter('replied')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${feedbackFilter === 'replied' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                С ответом
              </button>
              <button onClick={() => setFeedbackFilter('archived')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${feedbackFilter === 'archived' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                Архив
              </button>
            </div>
            {
            isLoading ? <p className="text-center opacity-50 mt-10">Загрузка...</p> :
            filteredFeedbacks.length === 0 ? <p className="text-center opacity-50 mt-10">Нет отзывов</p> :
            filteredFeedbacks.map((fb, i) => (
              <div key={i} className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-300 text-sm">{fb.username}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-50">{new Date(fb.created_at).toLocaleDateString()}</span>
                    <button onClick={() => handleArchive(fb.id)} className="text-gray-400 hover:text-indigo-500 transition-colors" title="В архив"><Archive size={14} /></button>
                    <button onClick={() => handleDelete(fb.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Удалить"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">{fb.message}</p>
                
                {fb.status === 'replied' ? (
                  <div className="mt-3 pl-3 border-l-2 border-green-500">
                    <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase">Ответ отправлен:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{fb.admin_reply}</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    {replyingId === fb.id ? (
                      <div className="flex gap-2">
                        <input 
                          value={replyText} 
                          onChange={(e) => setReplyText(e.target.value)} 
                          placeholder="Ваш ответ..." 
                          className="flex-1 bg-white/50 dark:bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                        />
                        <button onClick={() => handleSendReply(fb)} className="p-2 bg-green-500 text-white rounded-xl"><Send size={16} /></button>
                        <button onClick={() => setReplyingId(null)} className="p-2 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl"><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setReplyingId(fb.id); setReplyText(''); }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"><Reply size={12} /> Ответить</button>
                    )}
                  </div>
                )}
              </div>
            ))}
            </>
          ) : activeTab === 'dictionary' ? (
            <div className="space-y-4">
              <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/10">
                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Поиск и проверка</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    value={searchQuery} 
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchResult(null); }} 
                    placeholder="Поиск..." 
                    className="flex-1 bg-white/50 dark:bg-black/20 border border-white/10 rounded-xl px-3 py-2 outline-none" 
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button onClick={handleSearch} className="p-3 rounded-xl text-white bg-blue-500 hover:bg-blue-600 transition-all">
                    <Search size={20} />
                  </button>
                </div>
                {searchResult === 'found' && (
                  <div className="text-green-600 dark:text-green-400 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1"><Check size={16} /> Слово есть в базе</div>
                )}
                {searchResult === 'not-found' && (
                  <div className="text-red-500 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1"><X size={16} /> Слово не найдено</div>
                )}
              </div>

              <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/10">
                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Добавить слово в базу</label>
                <div className="flex gap-2">
                  <input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Слово..." className="flex-1 bg-white/50 dark:bg-black/20 border border-white/10 rounded-xl px-3 py-2 outline-none" />
                  <button onClick={handleAddWord} className={`p-3 rounded-xl text-white transition-all ${wordStatus === 'success' ? 'bg-green-500' : 'bg-indigo-600'}`}>
                    {wordStatus === 'success' ? <Check size={20} /> : <Send size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 pb-4">
                {customWords.length === 0 ? (
                  <p className="text-center opacity-50 text-xs">Нет добавленных слов</p>
                ) : filteredCustomWords.length === 0 ? (
                  <p className="text-center opacity-50 text-xs">Ничего не найдено</p>
                ) : filteredCustomWords.map((item) => (
                  <div key={item.id} className="bg-white/40 dark:bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                    {editingId === item.id ? (
                      <>
                        <input 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 bg-white/50 dark:bg-black/20 border border-white/10 rounded-lg px-2 py-1 outline-none text-sm"
                          autoFocus
                        />
                        <button onClick={() => saveEdit(item.id, item.word)} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"><Save size={16} /></button>
                        <button onClick={cancelEdit} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-gray-800 dark:text-white flex-1">{item.word}</span>
                        <button onClick={() => startEdit(item)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteWord(item.id, item.word)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'broadcast' ? (
            <div className="space-y-4">
              <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/10">
                <label className="text-xs font-bold uppercase opacity-60 mb-2 block text-gray-800 dark:text-white">Сообщение для всех игроков</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-white/50 dark:bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none min-h-[120px] mb-4 text-gray-900 dark:text-white placeholder:text-gray-500"
                  placeholder="Введите текст рассылки..."
                />
                <button onClick={handleBroadcast} disabled={!broadcastMessage.trim()} className={`w-full py-3 rounded-xl text-white font-bold transition-all ${!broadcastMessage.trim() ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}>
                  Отправить
                </button>
                <p className="text-[10px] opacity-50 mt-2 text-center text-gray-600 dark:text-gray-400">Сообщение будет отправлено всем пользователям, запустившим бота.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/10">
                <label className="text-xs font-bold uppercase opacity-60 mb-4 block text-gray-800 dark:text-white">Проверка визуального стиля</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => onTestModal('reward')} className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">🎁 Награда</button>
                  <button onClick={() => onTestModal('achievements')} className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">🏆 Достижения</button>
                  <button onClick={() => onTestModal('collection')} className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">📚 Коллекция</button>
                  <button onClick={() => onTestModal('shop')} className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">🛍️ Магазин</button>
                  <button onClick={() => onTestModal('daily')} className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">⚡ Дейлик</button>
                  <button onClick={() => onTestModal('leaderboard')} className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">🥇 Рейтинг</button>
                  <button onClick={() => onTestModal('about')} className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">ℹ️ Помощь</button>
                  <button onClick={() => onTestModal('rank_up')} className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">👑 Повышение</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};