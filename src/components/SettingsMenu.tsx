import { Volume2, Music, Sun, Moon, X, Shield, Settings } from 'lucide-react';

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
    <div className="modal-overlay z-[300]">
      <div className="modal-content max-w-sm text-left">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Settings size={28} className="modal-icon" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Настройки</h2>
          </div>
          <button onClick={() => { playSfx('click'); onClose(); }} className="modal-close-btn">
            <X size={24} className="modal-icon" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Звук */}
          <div className="settings-row">
            <div className="flex items-center gap-3">
              <Volume2 size={24} className="text-green-500" />
              <span className="font-bold">Звуки</span>
            </div>
            <button 
              onClick={toggleSfx}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${sfxVolume > 0 ? 'bg-green-500' : 'toggle-btn-inactive'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${sfxVolume > 0 ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Музыка */}
          <div className="settings-row">
            <div className="flex items-center gap-3">
              <Music size={24} className="text-indigo-500" />
              <span className="font-bold">Музыка</span>
            </div>
            <button 
              onClick={toggleMusic}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${musicVolume > 0 ? 'bg-indigo-500' : 'toggle-btn-inactive'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${musicVolume > 0 ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Тема */}
          <div className="settings-row">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun size={24} className="text-amber-500" /> : <Moon size={24} className="text-purple-400" />}
              <span className="font-bold">Тема</span>
            </div>
            <button 
              onClick={toggleTheme}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-purple-600' : 'bg-amber-400'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {isAdmin && onOpenAdmin && (
            <button onClick={() => { playSfx('click'); onOpenAdmin(); }} className="btn-action-indigo">
              <Shield size={18} /> Панель администратора
            </button>
          )}

          {showExitButton && (
            <button onClick={() => { playSfx('click'); onExit(); onClose(); }} className="btn-action-red">
              Завершить раунд
            </button>
          )}
        </div>
        
        <div className="settings-footer">
          Slovodel Settings
        </div>
      </div>
    </div>
  );
};