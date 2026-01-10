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
    <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl w-full max-w-sm h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-pop border border-white/20 relative">
        <div className="bg-white/50 dark:bg-white/5 p-6 text-gray-900 dark:text-white shrink-0 border-b border-white/10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <BookOpenText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                Моя коллекция
              </h2>
              <p className="text-xs font-bold opacity-60 uppercase tracking-widest mt-1">Собрано редкостей: {words.length}</p>
            </div>
            <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {sortedWords.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 text-gray-900 dark:text-white">
              <BookOpenText size={64} strokeWidth={1} />
              <p className="font-bold italic">Тут пока тишина... Твои редкие слова всё ещё прячутся в словаре!</p>
            </div>
          ) : (
            sortedWords.map((word, i) => (
              <div key={i} className="p-4 rounded-2xl flex justify-between items-center animate-pop shadow-sm border bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/10">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider leading-none">{word.text}</span>
                  <span className="text-[10px] font-bold opacity-50 uppercase mt-1 text-gray-600 dark:text-gray-300">{word.length} букв</span>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 rounded-full">
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-300">+{word.score}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white/30 dark:bg-black/20 text-center text-[10px] uppercase font-black tracking-widest opacity-30 shrink-0 text-gray-900 dark:text-white">
          Словарь эрудита
        </div>
      </div>
    </div>
  );
};