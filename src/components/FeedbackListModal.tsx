import { useEffect, useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

interface FeedbackListModalProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
  fetchFeedbacks: () => Promise<any[]>;
}

export const FeedbackListModal = ({ onClose, playSfx, fetchFeedbacks }: FeedbackListModalProps) => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks().then(data => {
      setFeedbacks(data);
      setLoading(false);
    });
  }, [fetchFeedbacks]);

  return (
    <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-pop border border-white/20 h-[85vh] relative">
        <div className="bg-white/50 dark:bg-white/5 p-6 text-gray-900 dark:text-white shrink-0 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Отзывы
          </h2>
          <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-center opacity-50 mt-10">Загрузка...</p>
          ) : feedbacks.length === 0 ? (
            <p className="text-center opacity-50 mt-10">Нет отзывов</p>
          ) : (
            feedbacks.map((fb, i) => (
              <div key={i} className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-300 text-sm">{fb.username}</span>
                  <span className="text-[10px] opacity-50">{new Date(fb.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">{fb.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
