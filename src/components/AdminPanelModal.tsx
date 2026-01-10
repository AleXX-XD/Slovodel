import { useState, useEffect } from 'react';
import { X, Shield, MessageCircle, BookPlus, Send, Check, Trash2, Edit2, Save, Search, Reply, Archive } from 'lucide-react';
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
}

export const AdminPanelModal = ({ onClose, playSfx, fetchFeedbacks, addCustomWord, fetchAdminCustomWords, deleteCustomWord, updateCustomWord, onReply, onArchive, onDelete }: AdminPanelModalProps) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'dictionary'>('feedback');
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

  return (
    <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-pop border border-white/20 h-[85vh] relative">
        
        {/* Header */}
        <div className="bg-white/50 dark:bg-white/5 p-6 text-gray-900 dark:text-white shrink-0 border-b border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Админка
            </h2>
            <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex p-1 bg-gray-200/50 dark:bg-black/20 rounded-xl">
            <button onClick={() => setActiveTab('feedback')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'feedback' ? 'bg-white dark:bg-white/10 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              <MessageCircle size={16} /> Отзывы
            </button>
            <button onClick={() => setActiveTab('dictionary')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'dictionary' ? 'bg-white dark:bg-white/10 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              <BookPlus size={16} /> Словарь
            </button>
          </div>
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
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};