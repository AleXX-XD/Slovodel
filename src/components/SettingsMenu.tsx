import { Volume2, Music, Sun, Moon, X, Shield } from 'lucide-react';

interface SettingsMenuProps {
  musicVolume: number;
  setMusicVolume: (v: number) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onClose: () => void;
  onExit: () => void;
  playSfx: (key: any) => void;
  showExitButton: boolean;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
}

export const SettingsMenu = ({
  musicVolume, setMusicVolume,
  sfxVolume, setSfxVolume,
  theme, setTheme,
  onClose, onExit, playSfx, showExitButton, isAdmin, onOpenAdmin
}: SettingsMenuProps) => {

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
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-white/20 animate-pop">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Настройки</h2>
          <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
            <X size={24} className="text-gray-800 dark:text-white" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Звук */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <Volume2 size={24} className="text-gray-600 dark:text-gray-300" />
              <span className="font-bold text-gray-800 dark:text-white">Звуки</span>
            </div>
            <button 
              onClick={toggleSfx}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${sfxVolume > 0 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${sfxVolume > 0 ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Музыка */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <Music size={24} className="text-gray-600 dark:text-gray-300" />
              <span className="font-bold text-gray-800 dark:text-white">Музыка</span>
            </div>
            <button 
              onClick={toggleMusic}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${musicVolume > 0 ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${musicVolume > 0 ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Тема */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun size={24} className="text-amber-500" /> : <Moon size={24} className="text-purple-400" />}
              <span className="font-bold text-gray-800 dark:text-white">Тема</span>
            </div>
            <button 
              onClick={toggleTheme}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-purple-600' : 'bg-amber-400'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {isAdmin && onOpenAdmin && (
            <button onClick={() => { playSfx('click'); onOpenAdmin(); }} className="w-full py-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-2xl border border-indigo-500/20 active:scale-95 transition-all uppercase text-sm hover:bg-indigo-500/20 flex items-center justify-center gap-2">
              <Shield size={18} /> Панель администратора
            </button>
          )}

          {showExitButton && (
            <button onClick={() => { playSfx('click'); onExit(); onClose(); }} className="w-full py-4 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl border border-red-500/20 active:scale-95 transition-all uppercase text-sm hover:bg-red-500/20">
              Завершить раунд
            </button>
          )}
        </div>
        
        <div className="mt-6 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Slovodel Settings
        </div>
      </div>
    </div>
  );
};