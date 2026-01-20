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
        <div className="modal-header-container">
          <div className="modal-header-title-group">
            <BookOpenText size={28} className="modal-header-icon" />
            <div>
              <h2 className="modal-header-text">Моя коллекция</h2>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Собрано редкостей: {words.length}</p>
            </div>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
            <X size={24} className="modal-icon" />
          </button>
        </div>

        <div className="about-scroll-container">
          {sortedWords.length === 0 ? (
            <div className="collection-empty-state">
              <BookOpenText size={64} strokeWidth={1} className="collection-empty-icon" />
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

        <div className="mt-4 shrink-0">
          <div className="creator-footer">
            Словарь эрудита
          </div>
        </div>
      </div>
    </div>
  );
};