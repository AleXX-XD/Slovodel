import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, MessageCircle, BookPlus, Send, Check, Trash2, Edit2, Search, Reply, Archive, Megaphone, X, Eye, Plus, AlertCircle, Info } from 'lucide-react';

interface AdminPanelModalProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
  fetchFeedbacks: () => Promise<any[]>;
  addCustomWord: (word: string) => Promise<any>;
  deleteCustomWord: (idOrWord: number | string) => Promise<boolean>;
  updateCustomWord: (word: string, definition: string) => Promise<boolean>;
  onSearchWord: (word: string) => Promise<any>;
  onReply: (feedbackId: number, telegramId: number, text: string) => Promise<boolean>;
  onArchive: (id: number) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onBroadcast: (message: string) => Promise<boolean>;
  onTestModal: (type: string) => void;
  fetchAdminCustomWords?: any;
}

export const AdminPanelModal = ({ onClose, playSfx, fetchFeedbacks, addCustomWord, deleteCustomWord, updateCustomWord, onSearchWord, onReply, onArchive, onDelete, onBroadcast, onTestModal }: AdminPanelModalProps) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'dictionary' | 'broadcast' | 'testing'>('feedback');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    if (type === 'success') playSfx('success'); // Или другой звук
    if (type === 'error') playSfx('error');
    setTimeout(() => setNotification(null), 3500);
  };

  // Dictionary State
  const [newWord, setNewWord] = useState('');
  const [dictSearchQuery, setDictSearchQuery] = useState('');
  const [dictSearchResult, setDictSearchResult] = useState<{ word: string, definition: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [wordStatus, setWordStatus] = useState<'idle' | 'success' | 'error' | 'exists'>('idle');
  
  // Edit State for Search Result
  const [editDef, setEditDef] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Feedback State
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
    }
  }, [activeTab, fetchFeedbacks]);

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    setWordStatus('idle');
    try {
      const res = await addCustomWord(newWord.trim());
      if (res && res.success) {
        setNewWord('');
        setWordStatus('success');
        showNotification(`Слово "${res.word}" добавлено!`, 'success');
        
        // Показываем добавленное слово
        setDictSearchQuery(res.word);
        setDictSearchResult({ word: res.word, definition: res.definition });
        setEditDef(res.definition);
      } else {
        setWordStatus(res?.error === 'Exists' ? 'exists' : 'error');
        showNotification(res?.error === 'Exists' ? 'Слово уже существует' : 'Ошибка добавления', 'error');
      }
    } catch (e) {
      showNotification('Ошибка сети или сервера', 'error');
    }
  };

  const handleDictSearch = async () => {
    if (!dictSearchQuery.trim()) return;
    setIsSearching(true);
    setDictSearchResult(null);
    setIsEditing(false);
    
    try {
      const result = await onSearchWord(dictSearchQuery.trim());
      if (result) {
        setDictSearchResult(result);
        setEditDef(result.definition || '');
      } else {
        setDictSearchResult(null);
        showNotification('Слово не найдено', 'info');
      }
    } catch (e) {
        showNotification('Ошибка поиска', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveDef = async () => {
    if (!dictSearchResult) return;
    try {
        const success = await updateCustomWord(dictSearchResult.word, editDef);
        if (success) {
          setDictSearchResult({ ...dictSearchResult, definition: editDef });
          setIsEditing(false);
          showNotification('Определение обновлено!', 'success');
        } else {
          showNotification('Ошибка сохранения', 'error');
        }
    } catch (e) {
        showNotification('Ошибка сети', 'error');
    }
  };

  const handleDeleteFoundWord = async () => {
    if (!dictSearchResult) return;
    if (window.confirm(`Удалить слово "${dictSearchResult.word}" из словаря?`)) {
      try {
          const success = await deleteCustomWord(dictSearchResult.word);
          if (success) {
            setDictSearchResult(null);
            setDictSearchQuery('');
            showNotification('Слово удалено из словаря', 'success');
          } else {
            showNotification('Не удалось удалить слово', 'error');
          }
      } catch (e) {
          showNotification('Ошибка сети', 'error');
      }
    }
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    if (feedbackFilter === 'archived') return fb.status === 'archived';
    if (fb.status === 'archived') return false; 

    if (feedbackFilter === 'new') return fb.status !== 'replied';
    if (feedbackFilter === 'replied') return fb.status === 'replied';
    return true;
  });

  const handleSendReply = async (fb: any) => {
    if (!replyText.trim()) return;
    try {
        const success = await onReply(fb.id, fb.telegram_id, replyText);
        if (success) {
          setReplyingId(null);
          setReplyText('');
          showNotification('Ответ отправлен пользователю', 'success');
          fetchFeedbacks().then(setFeedbacks);
        } else {
          showNotification('Ошибка отправки ответа', 'error');
        }
    } catch (e) {
        showNotification('Ошибка сети', 'error');
    }
  };

  const handleArchive = async (id: number) => {
    try {
        if (await onArchive(id)) {
          setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: 'archived' } : f));
          showNotification('Перемещено в архив', 'info');
        }
    } catch (e) {
        showNotification('Ошибка', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Удалить отзыв навсегда?')) {
      try {
          if (await onDelete(id)) {
            setFeedbacks(prev => prev.filter(f => f.id !== id));
            showNotification('Отзыв удален', 'success');
          }
      } catch (e) {
          showNotification('Ошибка удаления', 'error');
      }
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    if (window.confirm('Вы уверены, что хотите отправить это сообщение ВСЕМ игрокам?')) {
      try {
          const success = await onBroadcast(broadcastMessage);
          if (success) {
            setBroadcastMessage('');
            showNotification('Рассылка поставлена в очередь!', 'success');
          } else {
            showNotification('Ошибка создания рассылки', 'error');
          }
      } catch (e) {
          showNotification('Ошибка сети', 'error');
      }
    }
  };

  return (
    <div className="admin-container relative">
      {/* Notification Toast */}
      {notification && (
        <div className={`absolute top-4 left-4 right-4 z-50 p-3 rounded-xl shadow-lg border backdrop-blur-md animate-in slide-in-from-top-1 flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-100/90 border-green-200 text-green-800 dark:bg-green-900/90 dark:border-green-800 dark:text-green-100' :
            notification.type === 'error' ? 'bg-red-100/90 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-800 dark:text-red-100' :
            'bg-blue-100/90 border-blue-200 text-blue-800 dark:bg-blue-900/90 dark:border-blue-800 dark:text-blue-100'
        }`}>
            {notification.type === 'success' && <Check size={20} />}
            {notification.type === 'error' && <AlertCircle size={20} />}
            {notification.type === 'info' && <Info size={20} />}
            <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col h-full p-4">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <Shield size={28} className="modal-header-icon" />
            <h2 className="admin-header-title">Админка</h2>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="admin-back-btn">
            <ArrowLeft size={24} className="admin-back-icon" />
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
              <button onClick={() => setFeedbackFilter('all')} className={`admin-filter-btn ${feedbackFilter === 'all' ? 'admin-filter-btn-active' : 'admin-filter-btn-inactive'}`}>
                Все
              </button>
              <button onClick={() => setFeedbackFilter('new')} className={`admin-filter-btn ${feedbackFilter === 'new' ? 'admin-filter-btn-active' : 'admin-filter-btn-inactive'}`}>
                Новые
              </button>
              <button onClick={() => setFeedbackFilter('replied')} className={`admin-filter-btn ${feedbackFilter === 'replied' ? 'admin-filter-btn-active' : 'admin-filter-btn-inactive'}`}>
                С ответом
              </button>
              <button onClick={() => setFeedbackFilter('archived')} className={`admin-filter-btn ${feedbackFilter === 'archived' ? 'admin-filter-btn-active' : 'admin-filter-btn-inactive'}`}>
                Архив
              </button>
            </div>
            {
            isLoading ? <p className="text-center opacity-50 mt-10">Загрузка...</p> :
            filteredFeedbacks.length === 0 ? <p className="text-center opacity-50 mt-10">Нет отзывов</p> :
            filteredFeedbacks.map((fb, i) => (
              <div key={i} className="admin-card">
                <div className="flex justify-between items-start mb-2">
                  <span className="admin-card-header-text">{fb.username}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-50">{new Date(fb.created_at).toLocaleDateString()}</span>
                    <button onClick={() => handleArchive(fb.id)} className="text-gray-400 hover:text-indigo-500 transition-colors" title="В архив"><Archive size={14} /></button>
                    <button onClick={() => handleDelete(fb.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Удалить"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="admin-text-content">{fb.message}</p>
                
                {fb.status === 'replied' ? (
                  <div className="admin-reply-box">
                    <p className="admin-reply-label">Ответ отправлен:</p>
                    <p className="admin-reply-text">{fb.admin_reply}</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    {replyingId === fb.id ? (
                      <div className="flex gap-2">
                        <input 
                          value={replyText} 
                          onChange={(e) => setReplyText(e.target.value)} 
                          placeholder="Ваш ответ..." 
                          className="flex-1 admin-input-field"
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
              {/* Поиск */}
              <div className="admin-card">
                <label className="admin-section-label">Поиск и Редактирование</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    value={dictSearchQuery} 
                    onChange={(e) => setDictSearchQuery(e.target.value)} 
                    placeholder="Введите слово..." 
                    className="flex-1 admin-input-field" 
                    onKeyDown={(e) => e.key === 'Enter' && handleDictSearch()}
                  />
                  <button onClick={handleDictSearch} disabled={isSearching} className="p-3 rounded-xl text-white bg-blue-500 hover:bg-blue-600 transition-all">
                    {isSearching ? <div className="spinner w-5 h-5 border-2 border-white rounded-full animate-spin"></div> : <Search size={20} />}
                  </button>
                </div>

                {dictSearchResult ? (
                  <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black text-lg capitalize">{dictSearchResult.word}</h3>
                      <div className="flex gap-2">
                        {!isEditing && (
                          <button onClick={() => { setIsEditing(true); setEditDef(dictSearchResult.definition || ''); }} className="p-2 text-indigo-600 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><Edit2 size={16} /></button>
                        )}
                        <button onClick={handleDeleteFoundWord} className="p-2 text-red-600 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea 
                          value={editDef}
                          onChange={(e) => setEditDef(e.target.value)}
                          className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm outline-none min-h-[80px]"
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs font-bold">Отмена</button>
                          <button onClick={handleSaveDef} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold">Сохранить</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm opacity-80 leading-relaxed">{dictSearchResult.definition || "Нет определения"}</p>
                    )}
                  </div>
                ) : (
                  dictSearchQuery && !isSearching && <p className="text-center opacity-50 text-xs mt-2">Ничего не найдено</p>
                )}
              </div>

              {/* Добавление */}
              <div className="admin-card">
                <label className="admin-section-label">Добавить слово</label>
                <div className="flex gap-2">
                  <input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Новое слово..." className="flex-1 admin-input-field" />
                  <button onClick={handleAddWord} className={`p-3 rounded-xl text-white transition-all ${wordStatus === 'success' ? 'bg-green-500' : wordStatus === 'exists' ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                    {wordStatus === 'success' ? <Check size={20} /> : <Plus size={20} />}
                  </button>
                </div>
                {wordStatus === 'exists' && <p className="text-xs text-amber-500 font-bold mt-1">Такое слово уже есть!</p>}
                <p className="text-[10px] opacity-50 mt-1 text-center">Если слово новое, определение сгенерируется автоматически.</p>
              </div>
            </div>
          ) : activeTab === 'broadcast' ? (
            <div className="space-y-4">
              <div className="admin-card">
                <label className="admin-section-label">Сообщение для всех игроков</label>
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
              <div className="admin-card">
                <label className="admin-section-label">Проверка визуального стиля</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { playSfx('click'); onTestModal('reward') }} className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">🎁 Награда</button>
                  <button onClick={() => { playSfx('click'); onTestModal('rank_up') }} className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">👑 UI Тест</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
