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
    <div className="modal-overlay z-[400]">
      <div className="modal-content h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <MessageCircle size={28} className="modal-header-icon" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Отзывы</h2>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
            <X size={24} className="modal-icon" />
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
