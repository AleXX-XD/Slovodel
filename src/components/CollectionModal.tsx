import { X, BookOpenText } from 'lucide-react';

export interface RareWord {
  text: string;
  length: number;
  score: number;
}

interface CollectionModalProps {
  words: RareWord[];
  onClose: () => void;
  playSfx: (sound: any) => void;
}

export const CollectionModal = ({ words, onClose, playSfx }: CollectionModalProps) => {
  const sortedWords = [...words].sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return b.score - a.score;
  });

  return (
    <div className="modal-overlay z-[400]">
      <div className="modal-content max-w-sm text-left flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <BookOpenText size={28} className="modal-header-icon" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Моя коллекция</h2>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Собрано редкостей: {words.length}</p>
            </div>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
            <X size={24} className="modal-icon" />
          </button>
        </div>

        <div className="about-scroll-container">
          {sortedWords.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-10 opacity-60">
              <BookOpenText size={64} strokeWidth={1} className="text-gray-400 dark:text-gray-600" />
              <p className="empty-state-text">Тут пока тишина...<br/>Твои редкие слова всё ещё прячутся в словаре!</p>
            </div>
          ) : (
            sortedWords.map((word, i) => (
              <div key={i} className="collection-item animate-pop">
                <div className="flex flex-col text-left">
                  <span className="collection-word">{word.text}</span>
                  <span className="collection-meta">{word.length} букв</span>
                </div>
                <div className="collection-score">
                  +{word.score}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 shrink-0">
          Словарь эрудита
        </div>
      </div>
    </div>
  );
};