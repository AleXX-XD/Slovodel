import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameStatus, WordEntry } from './types';
import { loadDictionary, getDictionary } from './utils/dictionary';
import { GoogleGenAI } from "@google/genai";

/* --- START TELEGRAM INITIALIZATION --- */
const tg = (window as any).Telegram?.WebApp;
const tgUser = tg?.initDataUnsafe?.user;
const USER_NAME = tgUser?.first_name || 'Анонимный Лингвист';
/* --- END TELEGRAM INITIALIZATION --- */

const RARE_LIST = "ЙЦФЧХШЩЫЬЪЖЭ"; 
const VOWELS_UNIQUE = "АОЕИУЯ"; 
const COMMON_CONSONANTS = "НТСРВЛКМДПБГЗ"; 

const SOUNDS = {
  bg: './sound/Bg.mp3', 
  click: './sound/Click.mp3',
  success: './sound/Succes.mp3',
  error: './sound/Error.mp3',
  bonus: './sound/Podskazka.mp3',
  rare_success: './sound/Redkoe_slovo.mp3'
};

/* --- START COLLECTION LOGIC --- */
interface RareWord {
  text: string;
  length: number;
  score: number;
}

const CollectionModal = ({ words, onClose, playSfx }: { words: RareWord[], onClose: () => void, playSfx: any }) => {
  const sortedWords = [...words].sort((a, b) => a.text.localeCompare(b.text));

  return (
    <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="theme-card rounded-3xl w-full max-w-sm h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-pop border border-white/10">
        <div className="bg-indigo-600 p-6 text-white shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Моя коллекция</h2>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">Собрано редкостей: {words.length}</p>
            </div>
            <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {sortedWords.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <span className="text-6xl">📖</span>
              <p className="font-bold italic">Тут пока тишина... Твои редкие слова всё ещё прячутся в словаре!</p>
            </div>
          ) : (
            sortedWords.map((word, i) => (
              <div key={i} className="theme-input p-4 rounded-2xl border border-indigo-500/10 flex justify-between items-center animate-pop shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-indigo-600 uppercase tracking-wider leading-none">{word.text}</span>
                  <span className="text-[10px] font-bold opacity-50 uppercase mt-1">{word.length} букв</span>
                </div>
                <div className="bg-indigo-50/10 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
                  <span className="text-sm font-black text-indigo-500">+{word.score}</span>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 bg-gray-500/5 text-center text-[10px] uppercase font-black tracking-widest opacity-30 shrink-0">
          Словарь эрудита • Версия 1.4
        </div>
      </div>
    </div>
  );
};
/* --- END COLLECTION LOGIC --- */

/* --- START DAILY LOGIC --- */
const getSeedFromDate = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

const createSeededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const getDailyDateString = () => new Date().toISOString().split('T')[0];

const calculateStreakStatus = () => {
  const lastDate = localStorage.getItem('slovodel_streak_date') || '';
  const currentCount = parseInt(localStorage.getItem('slovodel_streak_count') || '0', 10);
  const today = getDailyDateString();
  
  if (!lastDate) return { count: 0, status: 'new' };

  const last = new Date(lastDate);
  const now = new Date(today);
  const diffTime = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return { count: currentCount, status: 'continue' };
  if (diffDays === 0) return { count: currentCount, status: 'same_day' };
  return { count: 0, status: 'reset' };
};
/* --- END DAILY LOGIC --- */

/* --- START THEME LOGIC --- */
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('slovodel_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('slovodel_theme', theme);
  }, [theme]);

  return { theme, setTheme };
};
/* --- END THEME LOGIC --- */

/* --- LEADERBOARD MODAL --- */
const LeaderboardModal = ({ data, onClose, playSfx }: any) => (
  <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 backdrop-blur-md">
    <div className="theme-card rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-pop border border-white/10">
      <div className="bg-amber-500 p-6 text-white shrink-0 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight">Топ Эрудитов 🏆</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {data.length === 0 ? (
          <p className="text-center opacity-50">Загрузка данных...</p>
        ) : (
          data.map((player: any, i: number) => (
            <div key={i} className="theme-input p-3 rounded-2xl flex justify-between items-center border border-amber-500/10">
              <span className="font-bold">{i + 1}. {player.name}</span>
              <span className="font-black text-amber-600">{player.score}</span>
            </div>
          ))
        )}
      </div>
      <button onClick={() => { playSfx('click'); onClose(); }} className="m-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl">Закрыть</button>
    </div>
  </div>
);


const SettingsMenu = ({ 
  musicVolume, setMusicVolume, 
  sfxVolume, setSfxVolume, 
  theme, setTheme,
  onClose, onAbout, onExit,
  playSfx,
  showExitButton = false
}: any) => (
  <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
    <div className="theme-card rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl animate-pop p-0 border border-gray-100/10">
      <div className="bg-indigo-600 p-6 text-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Настройки</h2>
      </div>
      <div className="p-6 space-y-6 text-gray-900 dark:text-white">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold">🎶 Музыка</span>
            <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">{(musicVolume * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.05" 
            value={musicVolume} 
            onChange={(e) => setMusicVolume(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold">🔊 Звуки</span>
            <span className="text-xs font-black text-pink-500 bg-pink-50 px-2 py-1 rounded-lg">{(sfxVolume * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.05" 
            value={sfxVolume} 
            onChange={(e) => setSfxVolume(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold">🌓 Тема</span>
          <button 
            onClick={() => { playSfx('click'); setTheme(theme === 'light' ? 'dark' : 'light'); }}
            className="px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-xl font-black text-xs uppercase border border-indigo-500/20"
          >
            {theme === 'light' ? 'Светлая' : 'Темная'}
          </button>
        </div>

        <div className="pt-2 space-y-3">
          <button 
            onClick={() => { playSfx('click'); onAbout(); }}
            className="w-full py-3 border-2 border-indigo-100/20 bg-indigo-50/5 text-indigo-500 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            ❓ Об игре
          </button>
          
          {showExitButton && (
            <button 
              onClick={() => { playSfx('click'); onExit(); }}
              className="w-full py-3 bg-red-500/10 text-red-500 border-2 border-red-500/20 font-bold rounded-2xl active:scale-95 transition-all"
            >
              🚪 Завершить раунд
            </button>
          )}
        </div>
        
        <button 
          onClick={() => { playSfx('click'); onClose(); }}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          Продолжить
        </button>
      </div>
    </div>
  </div>
);

const AboutSection = ({ onClose, playSfx }: any) => (
  <div className="fixed inset-0 theme-card z-[300] flex flex-col p-6 overflow-y-auto">
    <div className="flex items-center gap-4 mb-8">
      <button onClick={() => { playSfx('click'); onClose(); }} className="p-2 theme-input rounded-xl">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h2 className="text-2xl font-black text-indigo-600 uppercase">Механика</h2>
    </div>
    <div className="space-y-6 leading-relaxed text-gray-900 dark:text-white">
      <section className="bg-indigo-50/10 p-4 rounded-2xl border border-indigo-100/20">
        <h3 className="font-black text-indigo-600 uppercase text-sm mb-2">Суть игры</h3>
        <p>Составляйте русские существительные. На раунд дается 60 секунд. Копите общий счет, чтобы получать новые звания!</p>
      </section>
      <section className="space-y-4">
        <h3 className="font-black opacity-40 uppercase text-xs">Звания эрудитов:</h3>
        <div className="grid grid-cols-1 gap-2">
          {["🌱 Новичок-грамотей", "📚 Книжный червь", "🧙‍♂️ Мастер слов", "👑 Живая энциклопедия"].map((rank, i) => (
            <div key={i} className="p-3 theme-input rounded-xl border border-white/5">
              <p className="font-bold text-indigo-400 text-sm">{rank}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
    <button onClick={() => { playSfx('click'); onClose(); }} className="mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg">Понятно</button>
  </div>
);

// --- ГЛАВНЫЙ КОМПОНЕНТ ---
export default function App({ saveScore, getLeaderboard, tg }: any) {
  const [status, setStatus] = useState<GameStatus>('menu');
  const [isDictLoading, setIsDictLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  
  // Состояния для глобального рейтинга
  const [showGlobalRanking, setShowGlobalRanking] = useState(false);
  const [globalData, setGlobalData] = useState([]);
  
  const { theme, setTheme } = useTheme();

  const [musicVolume, setMusicVolume] = useState(() => Number(localStorage.getItem('slovodel_music_vol') ?? 0.3));
  const [sfxVolume, setSfxVolume] = useState(() => Number(localStorage.getItem('slovodel_sfx_vol') ?? 0.5));
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const [totalScore, setTotalScore] = useState(() => {
    const saved = localStorage.getItem('slovodel_total_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('slovodel_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [streak, setStreak] = useState(() => calculateStreakStatus().count);
  const [hasPlayedToday, setHasPlayedToday] = useState(() => localStorage.getItem('slovodel_streak_date') === getDailyDateString());
  const [streakMilestone, setStreakMilestone] = useState<string | null>(null);

  const [rareWords, setRareWords] = useState<RareWord[]>(() => {
    const saved = localStorage.getItem('slovodel_rare_words');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('slovodel_rare_words', JSON.stringify(rareWords));
  }, [rareWords]);

  const [dailyStatus, setDailyStatus] = useState(() => {
    const saved = localStorage.getItem('slovodel_daily_play');
    return saved ? JSON.parse(saved) : { date: '', score: 0 };
  });

  const [lastRoundRecordBeaten, setLastRoundRecordBeaten] = useState<number | null>(null);

  const showToast = useCallback((text: string, type: 'good' | 'bad') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  }, []);

  /* --- INITIAL TELEGRAM EFFECTS --- */
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor(theme === 'light' ? '#eef2ff' : '#111827');
    }
  }, [theme]);

  /* --- INITIAL STREAK CHECK --- */
  useEffect(() => {
    const res = calculateStreakStatus();
    if (res.status === 'reset' && streak > 0) {
      showToast('Твой огонь погас... Но ничего, фениксы всегда возрождаются из пепла и букв! Начинаем новую серию!', 'bad');
      setStreak(0);
      localStorage.setItem('slovodel_streak_count', '0');
    }
  }, []);

  const getStreakTitle = (s: number) => {
    if (s >= 30) return "Повелитель буквенного пламени";
    if (s >= 14) return "Огненный лингвист";
    if (s >= 7) return "Пламя знаний";
    if (s >= 3) return "Искра слова";
    return null;
  };

  const getUserRank = (points: number) => {
    if (points < 5000) return "Новичок-грамотей";
    if (points < 10000) return "Книжный червь";
    if (points < 50000) return "Мастер слов";
    return "Живая энциклопедия";
  };

  const [grid, setGrid] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<WordEntry[]>([]);
  const [message, setMessage] = useState<{text: string, type: 'good' | 'bad'} | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bonusTimeLeft, setBonusTimeLeft] = useState(2);
  const [bonusSwapLeft, setBonusSwapLeft] = useState(2);
  const [bonusHintLeft, setBonusHintLeft] = useState(3); 
  const [bonusWildcardLeft, setBonusWildcardLeft] = useState(2);
  const [wildcardActiveSeconds, setWildcardActiveSeconds] = useState(0);
  const [swapTargetIdx, setSwapTargetIdx] = useState<number | null>(null);
  const [isSwapActive, setIsSwapActive] = useState(false);
  const [hintWord, setHintWord] = useState<string | null>(null);
  const [hintDefinition, setHintDefinition] = useState<string | null>(null);
  const [isDefinitionLoading, setIsDefinitionLoading] = useState(false);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playSfx = useCallback((type: keyof typeof SOUNDS) => {
    if (type === 'bg') return;
    const audio = new Audio(SOUNDS[type]);
    audio.volume = sfxVolume;
    audio.play().catch(() => {});
    
    // Вибрация при звуковых эффектах (успех/ошибка)
    if (type === 'success' || type === 'rare_success') tg?.HapticFeedback?.notificationOccurred('success');
    if (type === 'error') tg?.HapticFeedback?.notificationOccurred('error');
    if (type === 'bonus') tg?.HapticFeedback?.impactOccurred('medium');
  }, [sfxVolume]);

  
  /* --- BACKGROUND MUSIC LOGIC --- */

  useEffect(() => {
    if (!bgMusicRef.current) {
      bgMusicRef.current = new Audio(SOUNDS.bg);
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

    useEffect(() => {
    if (bgMusicRef.current) {
      if (status === 'playing' && !isMenuOpen) {
        bgMusicRef.current.play().catch((e) => console.log("Audio play failed", e));
      } else {
        bgMusicRef.current.pause();
        // Сбрасываем трек, если раунд закончен
        if (status !== 'playing') {
          bgMusicRef.current.currentTime = 0;
        }
      }
    }
  }, [status, isMenuOpen]);

  useEffect(() => {
    if (bgMusicRef.current) bgMusicRef.current.volume = musicVolume;
    localStorage.setItem('slovodel_music_vol', musicVolume.toString());
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem('slovodel_sfx_vol', sfxVolume.toString());
  }, [sfxVolume]);

  useEffect(() => {
    loadDictionary().then(() => setIsDictLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('slovodel_total_score', totalScore.toString());
    localStorage.setItem('slovodel_high_score', highScore.toString());
    localStorage.setItem('slovodel_rare_words', JSON.stringify(rareWords));
  }, [totalScore, highScore, rareWords]);

  const finishGame = useCallback(() => {
    const finalScore = score;
    const oldHighScore = highScore;
    
    setTotalScore(prev => prev + finalScore);
    saveScore(finalScore); // SUPABASE CALL
    
    if (finalScore > oldHighScore) {
      setHighScore(finalScore);
      setLastRoundRecordBeaten(finalScore - oldHighScore);
    } else {
      setLastRoundRecordBeaten(null);
    }

    const today = getDailyDateString();
    if (!hasPlayedToday) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setHasPlayedToday(true);
      localStorage.setItem('slovodel_streak_count', newStreak.toString());
      localStorage.setItem('slovodel_streak_date', today);
      
      const title = getStreakTitle(newStreak);
      if ([3, 7, 14, 30].includes(newStreak)) {
        setStreakMilestone(title);
      } else {
        showToast('Твой внутренний филолог в огне! 🔥 Продолжай в том же духе!', 'good');
      }
    }

    if (isDailyMode) {
      const todayDaily = getDailyDateString();
      const info = { date: todayDaily, score: finalScore };
      setDailyStatus(info);
      localStorage.setItem('slovodel_daily_play', JSON.stringify(info));
    }

    setStatus('results');
    setShowConfirm(false);
    setIsMenuOpen(false);
    setIsDailyMode(false);
    setWildcardActiveSeconds(0);
    playSfx('bonus');
    
    // Telegram MainButton на финише
    if (tg) {
      tg.MainButton.setText("В главное меню");
      tg.MainButton.show();
      const onMenuClick = () => {
        setStatus('menu');
        tg.MainButton.hide();
        tg.MainButton.offClick(onMenuClick);
      };
      tg.MainButton.onClick(onMenuClick);
      tg.disableClosingConfirmation();
    }
  }, [score, highScore, isDailyMode, playSfx, hasPlayedToday, streak, showToast, saveScore]);

  useEffect(() => {
    let interval: number;
    if (status === 'playing' && timeLeft > 0 && !isMenuOpen) {
      interval = window.setInterval(() => {
        setTimeLeft(t => t - 1);
        setWildcardActiveSeconds(ws => Math.max(0, ws - 1));
      }, 1000);
    } else if (timeLeft === 0 && status === 'playing') {
      finishGame();
    }
    return () => clearInterval(interval);
  }, [status, timeLeft, isMenuOpen, finishGame]);

  const startGame = (difficultyLevel: number, daily: boolean = false) => {
    if (isDictLoading) return;
    playSfx('click');
    setMultiplier(daily ? 2 : (difficultyLevel === 10 ? 1 : difficultyLevel === 8 ? 2 : 3));
    setIsDailyMode(daily);
    
    const generateGrid = (level: number, seeded: boolean) => {
      const letters = new Set<string>();
      const rand = seeded ? createSeededRandom(getSeedFromDate()) : Math.random;
      const targetVowels = level === 10 ? 4 : level === 8 ? 3 : 2;
      const vowelsPool = VOWELS_UNIQUE.split('').sort(() => (seeded ? rand() - 0.5 : Math.random() - 0.5));
      for (const v of vowelsPool) {
        if (letters.size >= targetVowels) break;
        letters.add(v);
      }
      const consPool = COMMON_CONSONANTS.split('').sort(() => (seeded ? rand() - 0.5 : Math.random() - 0.5));
      for (const c of consPool) {
        if (letters.size >= level) break;
        letters.add(c);
      }
      const fullPool = (COMMON_CONSONANTS + VOWELS_UNIQUE).split('').sort(() => (seeded ? rand() - 0.5 : Math.random() - 0.5));
      for (const char of fullPool) {
        if (letters.size >= level) break;
        letters.add(char);
      }
      return Array.from(letters).sort(() => (seeded ? rand() - 0.5 : Math.random() - 0.5));
    };

    setGrid(generateGrid(daily ? 8 : difficultyLevel, daily));
    setFoundWords([]);
    setCurrentInput([]);
    setScore(0);
    setTimeLeft(60);
    setBonusTimeLeft(daily ? 1 : 2);
    setBonusSwapLeft(daily ? 1 : 2);
    setBonusHintLeft(daily ? 1 : 3);
    setBonusWildcardLeft(daily ? 1 : 2);
    setWildcardActiveSeconds(0);
    setSwapTargetIdx(null);
    setIsSwapActive(false);
    setHintWord(null);
    setHintDefinition(null);
    setStatus('playing');
    
    // Telegram Game Setup
    tg?.enableClosingConfirmation();
    tg?.MainButton.hide();
  };

  const hintIndices = useMemo(() => {
    if (!hintWord) return new Set<number>();
    const indices = new Set<number>();
    const tempGrid = [...grid];
    for (const char of hintWord.toLowerCase()) {
      const idx = tempGrid.findIndex(l => l.toLowerCase() === char);
      if (idx !== -1) {
        indices.add(idx);
        tempGrid[idx] = "USED"; 
      }
    }
    return indices;
  }, [hintWord, grid]);

  const checkWord = () => {
    const rawWord = currentInput.join('').toLowerCase();
    const dictionary = getDictionary();
    if (rawWord.length < 2) {
      playSfx('error');
      return showToast('Коротко!', 'bad');
    }
    let targetWord = rawWord;
    let foundInDict = false;
    if (rawWord.includes('*')) {
      const regexStr = "^" + rawWord.replace(/\*/g, '.') + "$";
      const regex = new RegExp(regexStr);
      if (dictionary) {
        const foundSet = new Set(foundWords.map(w => w.text.toLowerCase()));
        for (const dictWord of dictionary) {
          if (regex.test(dictWord) && !foundSet.has(dictWord)) {
            targetWord = dictWord;
            foundInDict = true;
            break;
          }
        }
      }
    } else {
      const word = rawWord.replace(/ё/g, 'е');
      if (dictionary && dictionary.has(word)) foundInDict = true;
    }
    if (!rawWord.includes('*') && foundWords.some(w => w.text === targetWord)) {
      playSfx('error');
      showToast('Уже было!', 'bad');
      setCurrentInput([]);
      return;
    }
    if (foundInDict) {
      const finalPoints = targetWord.length * 10 * multiplier;
      
      if (targetWord.length >= 7) {
        playSfx('rare_success');
        const isNew = !rareWords.some(r => r.text === targetWord.toLowerCase());
        if (isNew) {
          showToast(`✨ НОВАЯ РЕДКОСТЬ: ${targetWord.toUpperCase()}!`, 'good');
          setRareWords(prev => [...prev, { text: targetWord.toLowerCase(), length: targetWord.length, score: finalPoints }]);
        } else {
          showToast(`🌟 РЕДКОЕ СЛОВО: ${targetWord.toUpperCase()}!`, 'good');
        }
      } else {
        playSfx('success');
        showToast(`+${finalPoints}`, 'good');
      }

      setFoundWords(prev => [{ text: targetWord, score: finalPoints }, ...prev]);
      setScore(s => s + finalPoints);

      if (hintWord && targetWord === hintWord.toLowerCase()) {
        setHintWord(null);
        setHintDefinition(null);
      }
      setCurrentInput([]);
    } else {
      playSfx('error');
      showToast('Нет такого слова', 'bad');
      setCurrentInput([]);
    }
  };

  const openGlobalRanking = async () => {
    playSfx('click');
    setShowGlobalRanking(true);
    const data = await getLeaderboard();
    setGlobalData(data);
  };

  const handleAddTime = () => {
    if (bonusTimeLeft <= 0) return;
    playSfx('bonus');
    setBonusTimeLeft(prev => prev - 1);
    setTimeLeft(prev => prev + 15);
    showToast('+15 секунд!', 'good');
  };

  const handleWildcard = () => {
    if (wildcardActiveSeconds > 0) {
      if (currentInput.includes('*')) { playSfx('error'); return; }
      playSfx('click');
      setCurrentInput(prev => [...prev, '*']);
      return;
    }
    if (bonusWildcardLeft <= 0) return;
    playSfx('bonus');
    setBonusWildcardLeft(prev => prev - 1);
    setWildcardActiveSeconds(15);
    setCurrentInput(prev => [...prev, '*']);
    showToast('Джокер активен!', 'good');
  };

  const fetchWordDefinition = async (word: string) => {
    setIsDefinitionLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Кратко (до 8 слов) определи существительное: "${word}".`,
      });
      setHintDefinition(response.text || "Описание недоступно");
    } catch (e) { setHintDefinition("Описание недоступно"); }
    finally { setIsDefinitionLoading(false); }
  };

  const handleHint = async () => {
    if (bonusHintLeft <= 0) return;
    const dictionary = getDictionary();
    if (!dictionary) return;
    const availableStr = grid.join('').toLowerCase();
    const possibleWords: string[] = [];
    const foundSet = new Set(foundWords.map(w => w.text.toLowerCase()));
    for (const word of dictionary) {
      if (word.length < 3 || word.length > 5 || foundSet.has(word)) continue;
      let tempPool = availableStr;
      let possible = true;
      for (const char of word) {
        const idx = tempPool.indexOf(char);
        if (idx === -1) { possible = false; break; }
        tempPool = tempPool.substring(0, idx) + tempPool.substring(idx + 1);
      }
      if (possible) possibleWords.push(word);
    }
    if (possibleWords.length > 0) {
      playSfx('bonus');
      possibleWords.sort((a, b) => b.length - a.length);
      let nextHint = possibleWords[0];
      setHintWord(nextHint.toUpperCase());
      setHintDefinition(null);
      setBonusHintLeft(prev => prev - 1);
      showToast('Слово найдено!', 'good');
      fetchWordDefinition(nextHint);
    } else {
      playSfx('error');
      showToast('Слов больше нет', 'bad');
    }
  };

  const toggleSwapMode = () => {
    if (bonusSwapLeft <= 0) return;
    playSfx('click');
    setIsSwapActive(!isSwapActive);
  };

  const startSwap = (idx: number) => {
    playSfx('click');
    setSwapTargetIdx(idx);
    setIsSwapActive(false);
  };

  const performSwap = (newChar: string) => {
    if (swapTargetIdx === null) return;
    const char = newChar.toUpperCase();
    if (!/[А-ЯЁ]/.test(char) || grid.includes(char)) { playSfx('error'); return; }
    playSfx('bonus');
    const newGrid = [...grid];
    newGrid[swapTargetIdx] = char;
    setGrid(newGrid);
    setBonusSwapLeft(prev => prev - 1);
    setSwapTargetIdx(null);
  };

  const isDailyPlayedToday = dailyStatus.date === getDailyDateString();

  if (isDictLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6">
        <div className="spinner w-12 h-12 text-indigo-600 mb-4 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
        <h2 className="text-xl font-bold uppercase">Словодел</h2>
        <p className="text-sm opacity-50 mt-2">Готовим буквы...</p>
      </div>
    );
  }

  if (status === 'menu') {
    return (
      <div className="h-full w-full max-w-md mx-auto p-6 flex flex-col justify-center relative overflow-hidden">
        {streakMilestone && (
          <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
            <div className="theme-card rounded-3xl p-8 text-center animate-pop shadow-2xl border border-amber-500/30">
              <div className="text-6xl mb-4 animate-bounce">🔥</div>
              <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tight">Новое достижение!</h2>
              <p className="text-lg font-bold my-4 italic">"{streakMilestone}"</p>
              <p className="text-sm opacity-70 mb-6">Твоя серия: {streak} дн.</p>
              <button onClick={() => { playSfx('click'); setStreakMilestone(null); }} className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform uppercase">Продолжить</button>
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 flex gap-2">
          {/* КНОПКА ГЛОБАЛЬНОГО РЕЙТИНГА */}
          <button onClick={openGlobalRanking} className="p-2 theme-card rounded-xl font-bold shadow-md text-lg active:scale-90 transition-transform">🏆</button>
          
          <div className="theme-card px-3 py-1 rounded-xl shadow-md font-black flex items-center gap-1 border border-indigo-100/10 active:scale-95" title="Ударный режим">
            <span className={`text-lg ${hasPlayedToday ? "fire-active" : "fire-inactive"}`}>🔥</span>
            <span className={`text-sm ${hasPlayedToday ? "text-amber-500" : "opacity-30"}`}>{streak}</span>
          </div>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => { playSfx('click'); setShowCollection(true); }} className="p-2 theme-card rounded-xl font-bold shadow-md text-lg">📖</button>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 theme-card rounded-xl font-bold shadow-md">⚙️</button>
        </div>

        {isMenuOpen && (
          <SettingsMenu 
            musicVolume={musicVolume} setMusicVolume={setMusicVolume} 
            sfxVolume={sfxVolume} setSfxVolume={setSfxVolume} 
            theme={theme} setTheme={setTheme}
            onClose={() => setIsMenuOpen(false)} 
            onAbout={() => setIsAboutOpen(true)} 
            onExit={() => { setIsMenuOpen(false); setStatus('menu'); }}
            playSfx={playSfx}
            showExitButton={false}
          />
        )}
        {isAboutOpen && <AboutSection onClose={() => setIsAboutOpen(false)} playSfx={playSfx} />}
        {showCollection && <CollectionModal words={rareWords} onClose={() => setShowCollection(false)} playSfx={playSfx} />}
        {showGlobalRanking && <LeaderboardModal data={globalData} onClose={() => setShowGlobalRanking(false)} playSfx={playSfx} />}
        
        <div className="text-center mb-6 text-gray-900 dark:text-white">
          <h1 className="text-4xl font-black text-indigo-600 tracking-tighter">СЛОВОДЕЛ</h1>
          <div className="mt-2 inline-block px-3 py-1 bg-indigo-50/20 rounded-full border border-indigo-100/20">
            <p className="text-xs font-black uppercase tracking-widest italic">{USER_NAME}: {getUserRank(totalScore)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-center text-gray-900 dark:text-white">
          <div className="theme-card p-4 rounded-2xl shadow-sm border border-gray-100/10">
            <div className="text-[10px] opacity-50 uppercase font-bold mb-1">Ваш рекорд</div>
            <div className="text-2xl font-black">{highScore}</div>
          </div>
          <div className="theme-card p-4 rounded-2xl shadow-sm border border-gray-100/10">
            <div className="text-[10px] opacity-50 uppercase font-bold mb-1">Всего очков</div>
            <div className="text-2xl font-black">{totalScore}</div>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => !isDailyPlayedToday && startGame(8, true)} 
            disabled={isDailyPlayedToday}
            className={`w-full py-4 font-bold rounded-xl border-2 transition-all uppercase text-sm flex flex-col items-center justify-center
              ${isDailyPlayedToday 
                ? 'bg-gray-100/20 text-gray-400 border-gray-200/20' 
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-md active:scale-95'}`}
          >
            <span className="text-lg">✨ Испытание дня</span>
            {isDailyPlayedToday && <span className="text-[10px] lowercase normal-case mt-1">Набрано: {dailyStatus.score}. Завтра новый шанс!</span>}
          </button>
          
          <div className="pt-2 grid grid-cols-1 gap-3">
            <button onClick={() => startGame(10)} className="w-full py-4 bg-green-500/10 text-green-500 font-bold rounded-xl border-2 border-green-500/20 shadow-sm active:scale-95 transition-all uppercase text-sm">Лёгкий</button>
            <button onClick={() => startGame(8)} className="w-full py-4 bg-indigo-500/10 text-indigo-500 font-bold rounded-xl border-2 border-indigo-500/20 shadow-sm active:scale-95 transition-all uppercase text-sm">Средний</button>
            <button onClick={() => startGame(6)} className="w-full py-4 bg-red-500/10 text-red-500 font-bold rounded-xl border-2 border-red-500/20 shadow-sm active:scale-95 transition-all uppercase text-sm">Сложный</button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'results') {
    return (
      <div className="h-full w-full max-w-md mx-auto p-6 flex flex-col items-center justify-center animate-pop">
        <h2 className="opacity-40 uppercase mb-2 font-bold tracking-widest text-xs text-gray-900 dark:text-white">Раунд окончен</h2>
        <div className="text-7xl font-black text-indigo-600 mb-2">{score}</div>
        
        {lastRoundRecordBeaten !== null && (
          <div className="mb-6 text-center animate-bounce">
            <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-2xl border-2 border-amber-200 inline-block shadow-sm">
              <p className="font-black text-sm uppercase">Новый рекорд! 🎉</p>
            </div>
          </div>
        )}

        <div className="w-full space-y-2 mb-8 text-center px-4">
          <div className="text-[10px] opacity-40 uppercase font-bold text-gray-900 dark:text-white">Ваш прогресс:</div>
          <div className="h-2 w-full bg-gray-200/50 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, (totalScore % 5000) / 50)}%` }}></div>
          </div>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-tighter italic">{USER_NAME}, {getUserRank(totalScore)}</p>
        </div>

        <button onClick={() => { setStatus('menu'); tg?.MainButton.hide(); }} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all uppercase">В меню</button>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-md mx-auto flex flex-col relative overflow-hidden shadow-2xl transition-colors duration-300">
      {isMenuOpen && (
        <SettingsMenu 
          musicVolume={musicVolume} setMusicVolume={setMusicVolume} 
          sfxVolume={sfxVolume} setSfxVolume={setSfxVolume} 
          theme={theme} setTheme={setTheme}
          onClose={() => setIsMenuOpen(false)} 
          onAbout={() => setIsAboutOpen(true)} 
          onExit={() => setShowConfirm(true)}
          playSfx={playSfx} 
          showExitButton={true}
        />
      )}
      {isAboutOpen && <AboutSection onClose={() => setIsAboutOpen(false)} playSfx={playSfx} />}
      
      {swapTargetIdx !== null && (
        <div className="fixed inset-0 bg-black/80 z-[150] flex flex-col items-center justify-center p-6 backdrop-blur-sm">
          <div className="theme-card rounded-3xl p-8 w-full text-center animate-pop max-w-[280px]">
            <h3 className="text-xl font-black text-indigo-600 uppercase">Замена</h3>
            <p className="text-xs opacity-60 mt-2">Буква:</p>
            <input 
              autoFocus 
              className="w-20 h-20 text-4xl text-center border-4 border-indigo-600 rounded-2xl my-6 uppercase outline-none focus:ring-4 focus:ring-indigo-100 bg-transparent text-gray-900 dark:text-white" 
              maxLength={1} 
              onChange={(e) => performSwap(e.target.value)} 
            />
            <button onClick={() => setSwapTargetIdx(null)} className="w-full py-3 opacity-40 rounded-xl font-bold">Отмена</button>
          </div>
        </div>
      )}

      <header className="theme-card p-4 flex justify-between items-center shadow-sm text-gray-900 dark:text-white">
        <div className="flex flex-col">
          <div className="font-black text-indigo-600 text-xl">{score}</div>
          {isDailyMode && <div className="text-[10px] font-black uppercase text-amber-500">День 🏆</div>}
        </div>
        <div className={`text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : ''}`}>{formatTime(timeLeft)}</div>
        <div className="flex gap-2">
          <button onClick={() => { playSfx('click'); setIsMenuOpen(true); }} className="p-2 theme-input rounded-lg shadow-sm">⚙️</button>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-y-auto">
        {hintWord && (
          <div className="mb-4 bg-amber-500/10 border-2 border-amber-500/20 p-4 rounded-2xl animate-pop shadow-sm">
            <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Подсказка</div>
            <div className="text-sm font-bold italic text-amber-600 mt-1">{isDefinitionLoading ? "Думаю..." : hintDefinition}</div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {foundWords.map((w, i) => (
            <div key={i} className="theme-card border-2 border-indigo-100/20 px-3 py-1 rounded-lg font-bold text-sm text-indigo-500 shadow-sm flex items-center gap-1 animate-pop">
              <span className={w.text.length >= 7 ? "text-amber-500" : ""}>{w.text.toUpperCase()}</span> 
              <span className="text-green-500 text-[10px] font-black">+{w.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="theme-card p-4 rounded-t-3xl shadow-2xl z-20 border-t border-gray-100/5">
        <div className="h-16 mb-4 theme-input rounded-xl flex items-center justify-center relative border border-gray-200/10 px-10">
          {currentInput.length > 0 && (
            <button onClick={() => { playSfx('click'); setCurrentInput([]); }} className="absolute left-2 p-2 text-gray-400 theme-card rounded-lg shadow-sm active:scale-90 border border-gray-100/10" title="Стереть все">🗑️</button>
          )}

          <span className="text-2xl font-black tracking-widest text-indigo-600 uppercase truncate">
            {currentInput.join('') || <span className="opacity-20 text-sm font-normal normal-case italic text-gray-900 dark:text-white">Слово...</span>}
          </span>

          {currentInput.length > 0 && (
            <button onClick={() => { playSfx('click'); setCurrentInput(prev => prev.slice(0, -1)); }} className="absolute right-2 p-2 text-red-500 theme-card rounded-lg shadow-sm active:scale-90 border border-gray-100/10">⬅️</button>
          )}
        </div>

        <div className="mb-4 flex justify-around items-center theme-input/50 rounded-xl py-2">
          <button onClick={handleAddTime} disabled={bonusTimeLeft <= 0} className={`relative p-1 flex flex-col items-center ${bonusTimeLeft > 0 ? '' : 'opacity-30'}`}>
            <div className="w-10 h-10 theme-card rounded-full flex items-center justify-center border-2 border-indigo-200 shadow-sm text-lg">⏳</div>
            <span className="text-[10px] font-black text-indigo-600 mt-1">{bonusTimeLeft}</span>
          </button>
          <button onClick={handleHint} disabled={bonusHintLeft <= 0} className={`relative p-1 flex flex-col items-center ${bonusHintLeft > 0 ? '' : 'opacity-30'}`}>
            <div className="w-10 h-10 theme-card rounded-full flex items-center justify-center border-2 border-amber-200 shadow-sm text-lg">💡</div>
            <span className="text-[10px] font-black text-amber-600 mt-1">{bonusHintLeft}</span>
          </button>
          <button onClick={handleWildcard} disabled={bonusWildcardLeft <= 0 && wildcardActiveSeconds <= 0} className={`relative p-1 flex flex-col items-center ${bonusWildcardLeft > 0 || wildcardActiveSeconds > 0 ? '' : 'opacity-30'}`}>
            <div className={`w-10 h-10 theme-card rounded-full flex items-center justify-center border-2 shadow-sm text-lg ${wildcardActiveSeconds > 0 ? 'border-purple-600 animate-pulse' : 'border-purple-200'}`}>✨</div>
            <span className="text-[10px] font-black text-purple-600 mt-1">{wildcardActiveSeconds > 0 ? `${wildcardActiveSeconds}c` : bonusWildcardLeft}</span>
          </button>
          <button onClick={toggleSwapMode} disabled={bonusSwapLeft <= 0} className={`relative p-1 flex flex-col items-center ${bonusSwapLeft > 0 ? '' : 'opacity-30'}`}>
            <div className={`w-10 h-10 theme-card rounded-full flex items-center justify-center border-2 shadow-sm text-lg ${isSwapActive ? 'border-pink-600' : 'border-pink-200'}`}>🔄</div>
            <span className="text-[10px] font-black text-pink-600 mt-1">{bonusSwapLeft}</span>
          </button>
        </div>

        <div className={`grid ${grid.length === 10 ? 'grid-cols-5' : grid.length === 8 ? 'grid-cols-4' : 'grid-cols-3'} gap-3 mb-4`}>
          {grid.map((letter, idx) => (
            <button 
              key={idx} 
              onClick={() => { if (isSwapActive) startSwap(idx); else { playSfx('click'); setCurrentInput(p => [...p, letter]); } }} 
              className={`rounded-2xl font-black text-3xl flex items-center justify-center border-2 
                h-16 theme-card shadow-sm active:shadow-inner
                ${hintIndices.has(idx) ? 'border-amber-400 border-b-amber-600' : 'border-indigo-100/20 border-b-indigo-200/50'} 
                text-indigo-600 border-b-4 active:translate-y-1 active:border-b-2 transition-all`}
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => { playSfx('click'); setGrid([...grid].sort(() => Math.random() - 0.5)); }} className="flex-1 py-4 theme-input font-bold rounded-xl opacity-60 active:scale-95 transition-all uppercase text-xs">МИКС</button>
          <button onClick={checkWord} disabled={currentInput.length === 0} className={`flex-[2] py-4 font-bold rounded-xl text-white shadow-lg ${currentInput.length > 0 ? 'bg-green-500 active:scale-95' : 'bg-gray-300'} transition-all uppercase`}>ОК</button>
        </div>
      </div>

      {message && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-bold text-white shadow-2xl z-[100] animate-bounce text-center max-w-[80vw] ${message.type === 'good' ? 'bg-indigo-600' : 'bg-red-500'}`}>
          {message.text}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="theme-card rounded-2xl p-6 w-full max-w-[260px] text-center shadow-2xl animate-pop border border-white/10">
            <h3 className="font-bold mb-6 text-indigo-600 text-lg">Завершить раунд?</h3>
            <div className="flex gap-3">
              <button onClick={() => { playSfx('click'); setShowConfirm(false); }} className="flex-1 py-3 opacity-40 rounded-xl font-bold">Нет</button>
              <button onClick={() => { playSfx('click'); finishGame(); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold">Да</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}