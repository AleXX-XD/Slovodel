import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { GameStatus, WordEntry } from './types';
import { loadDictionary, getDictionary } from './utils/dictionary';
import { SOUNDS } from './utils/constants';
import { getDailyDateString, calculateStreakStatus, getStreakTitle, getUserRank, generateGrid, generateRandomReward, getRankMultiplier } from './utils/gameUtils';
import { CollectionModal, type RareWord } from './components/CollectionModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SettingsMenu } from './components/SettingsMenu';
import { AboutSection } from './components/AboutSection';
import { AchievementsModal } from './components/AchievementsModal';
import { MainMenu } from './components/MainMenu';
import { GameScreen } from './components/GameScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ShopModal } from './components/ShopModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { RewardModal } from './components/RewardModal';

/* --- START THEME LOGIC --- */
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('slovodel_theme') as 'light' | 'dark';
    return saved || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark'; // Сообщаем браузеру, что это темная тема
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    localStorage.setItem('slovodel_theme', theme);
  }, [theme]);

  return { theme, setTheme };
};
/* --- END THEME LOGIC --- */

// --- ГЛАВНЫЙ КОМПОНЕНТ ---
interface Player {
  name: string;
  score: number;
  telegram_id?: number;
  avatar_url?: string;
}
export default function App({ saveUserData, saveDailyScore, getUserData, getActiveChallenge, getLeaderboard, getDailyLeaderboard, fetchPreviousDailyLeaderboard, getUserDailyScore, fetchUserRank, saveFeedback, fetchFeedbacks, addCustomWord, fetchCustomWords, fetchAdminCustomWords, deleteCustomWord, updateCustomWord, sendFeedbackReply, archiveFeedback, deleteFeedback, sendBroadcast, tg }: any) {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const USER_NAME = tgUser ? (tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '')) : 'Анонимный Лингвист';
  
  // Получаем список ID администраторов из переменных окружения (VITE_ADMIN_IDS="123,456")
  const ADMIN_IDS = (import.meta.env.VITE_ADMIN_IDS || '')
    .split(',')
    .map((id: string) => Number(id.trim()))
    .filter((id: number) => !isNaN(id));
  
  const [status, setStatus] = useState<GameStatus>('menu');
  const [isDictLoading, setIsDictLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopPreviousScreen, setShopPreviousScreen] = useState<'about' | 'achievements' | null>(null);
  const [shopInitialTab, setShopInitialTab] = useState<'bonuses' | 'coins'>('bonuses');
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [currentChallengeId, setCurrentChallengeId] = useState<string>(() => {
    const saved = localStorage.getItem('slovodel_daily_play_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.challengeId) return parsed.challengeId;
      } catch (e) {}
    }
    return '1';
  });
  const [challengeLetters, setChallengeLetters] = useState<any>(null);
  const [challengeEndTime, setChallengeEndTime] = useState<string | null>(null);

  // Состояния для глобального рейтинга
  const [showGlobalRanking, setShowGlobalRanking] = useState(false);
  const [globalData, setGlobalData] = useState<Player[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<any>(null);
  const [leaderboardTab, setLeaderboardTab] = useState<'all' | 'daily' | 'previous'>('all');
  const [totalPlayersCount, setTotalPlayersCount] = useState(0);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

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

  const [totalWords, setTotalWords] = useState(() => {
    const saved = localStorage.getItem('slovodel_total_words');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Внутриигровая валюта
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('slovodel_coins');
    return saved ? parseInt(saved, 10) : 0; // Начальный баланс 0 (или 100 для теста)
  });

  const [streak, setStreak] = useState(() => calculateStreakStatus().count);
  const [hasPlayedToday, setHasPlayedToday] = useState(() => localStorage.getItem('slovodel_streak_date') === getDailyDateString());
  const [streakMilestone, setStreakMilestone] = useState<string | null>(null);

  const [rareWords, setRareWords] = useState<RareWord[]>(() => {
    const saved = localStorage.getItem('slovodel_rare_words');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Ошибка чтения редких слов:", e);
      }
    }
    return [];
  });

  // Новые состояния для статистики
  const [daysPlayed, setDaysPlayed] = useState(0);
  const [dailyPlaces, setDailyPlaces] = useState({ first: 0, second: 0, third: 0 });
  const [userRank, setUserRank] = useState(0);

  useEffect(() => {
    localStorage.setItem('slovodel_rare_words', JSON.stringify(rareWords));
  }, [rareWords]);

  const [dailyStatus, setDailyStatus] = useState<{ 
    challengeId: string; 
    scores: Record<number, number>;
    bonuses?: { time: number; hint: number; swap: number; wildcard: number };
    userId?: number;
  }>(() => {
    const saved = localStorage.getItem('slovodel_daily_play_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const isSameUser = parsed.userId === tgUser?.id;
        // Проверяем, не устарел ли локальный сейв (сравниваем с дефолтным '1', позже обновим из БД)
        if (isSameUser && parsed.challengeId && parsed.scores) return parsed;
      } catch (e) {
        console.error("Ошибка чтения сохранения:", e);
      }
    }
    return { challengeId: '1', scores: {}, userId: tgUser?.id };
  });

  const [lastRoundRecordBeaten, setLastRoundRecordBeaten] = useState<number | null>(null);
  const [newRankReached, setNewRankReached] = useState<string | null>(null);
  const [activeReward, setActiveReward] = useState<{ achievement: string; reward: { type: string; amount: number; } } | null>(null);
  const [pendingRewards, setPendingRewards] = useState<{ achievement: string; reward: { type: string; amount: number; } }[]>([]);
  const [otherUserProfile, setOtherUserProfile] = useState<any | null>(null);

  // Функция для тестирования UI из админки
  const handleTestModal = (type: string) => {
    setStatus('menu'); // Закрываем админку, чтобы увидеть результат
    setTimeout(() => {
      switch (type) {
        case 'reward': setActiveReward({ achievement: 'Тестовая награда', reward: { type: 'hint', amount: 5 } }); playSfx('reward_fanfare'); break;
        case 'rank_up': 
          setNewRankReached('Оракул Словодела'); 
          setStatus('results');
          break;
      }
    }, 100);
  };

  const showToast = useCallback((text: string, type: 'good' | 'bad') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  }, []);

  /* --- INITIAL TELEGRAM EFFECTS --- */
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      // indigo-200 (#c7d2fe) для светлой, slate-900 (#0f172a) для темной
      const color = theme === 'light' ? '#c7d2fe' : '#0f172a';
      tg.setHeaderColor(color);
      if (tg.setBackgroundColor) tg.setBackgroundColor(color);
    }
  }, [theme, tg]);

  /* --- INITIAL STREAK CHECK --- */
  useEffect(() => {
    const res = calculateStreakStatus();
    if (res.status === 'reset' && streak > 0) {
      showToast('Твой огонь погас... Но ничего, фениксы всегда возрождаются из пепла и букв! Начинаем новую серию!', 'bad');
      setStreak(0);
      localStorage.setItem('slovodel_streak_count', '0');
    }
  }, []);

  const [grid, setGrid] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<WordEntry[]>([]);
  const [message, setMessage] = useState<{ text: string, type: 'good' | 'bad' } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Бонусы: инициализация из localStorage (по умолчанию 2, если пусто)
  const [bonusTimeLeft, setBonusTimeLeft] = useState(() => Number(localStorage.getItem('slovodel_bonus_time') ?? 2));
  const [bonusSwapLeft, setBonusSwapLeft] = useState(() => Number(localStorage.getItem('slovodel_bonus_swap') ?? 2));
  const [bonusHintLeft, setBonusHintLeft] = useState(() => Number(localStorage.getItem('slovodel_bonus_hint') ?? 2));
  const [bonusWildcardLeft, setBonusWildcardLeft] = useState(() => Number(localStorage.getItem('slovodel_bonus_wildcard') ?? 2));

  // Реф для хранения бонусов пользователя во время ежедневного испытания
  const userBonusesRef = useRef({ time: 0, hint: 0, swap: 0, wildcard: 0 });

  const [wildcardActiveSeconds, setWildcardActiveSeconds] = useState(0);
  const [hintActiveSeconds, setHintActiveSeconds] = useState(0);
  const [hintRevealLeft, setHintRevealLeft] = useState(0);
  const [swapTargetIdx, setSwapTargetIdx] = useState<number | null>(null);
  const [isSwapActive, setIsSwapActive] = useState(false);
  const [hintWord, setHintWord] = useState<string | null>(null);
  const [hintDefinition, setHintDefinition] = useState<string | null>(null);
  const [isDefinitionLoading, setIsDefinitionLoading] = useState(false);
  const [usedHints, setUsedHints] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (hintWord && hintActiveSeconds === 0 && hintRevealLeft === 0) {
      setHintWord(null);
      setHintDefinition(null);
    }
  }, [hintActiveSeconds, hintRevealLeft, hintWord]);

  const playSfx = useCallback((type: keyof typeof SOUNDS) => {
    if (type === 'bg') return;
    const audio = new Audio(SOUNDS[type]);
    audio.volume = sfxVolume;
    audio.play().catch(() => { });

    // Вибрация при звуковых эффектах (успех/ошибка)
    if (type === 'success' || type === 'rare_success') tg?.HapticFeedback?.notificationOccurred('success');
    if (type === 'error') tg?.HapticFeedback?.notificationOccurred('error');
    if (type === 'bonus') tg?.HapticFeedback?.impactOccurred('medium');
  }, [sfxVolume, tg]);


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
      if (status === 'playing' && !isMenuOpen && !isAboutOpen && !isShopOpen) {
        bgMusicRef.current.play().catch((e) => console.log("Audio play failed", e));
      } else {
        bgMusicRef.current.pause();
        // Сбрасываем трек, если раунд закончен
        if (status !== 'playing') {
          bgMusicRef.current.currentTime = 0;
        }
      }
    }
  }, [status, isMenuOpen, isAboutOpen, isShopOpen]);

  useEffect(() => {
    if (bgMusicRef.current) bgMusicRef.current.volume = musicVolume;
    localStorage.setItem('slovodel_music_vol', musicVolume.toString());
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem('slovodel_sfx_vol', sfxVolume.toString());
  }, [sfxVolume]);

  useEffect(() => {
    loadDictionary().then(async () => {
      setIsDictLoading(false);
      // Загружаем дополнительные слова из Supabase
      if (fetchCustomWords) {
        const customWords = await fetchCustomWords();
        const dict = getDictionary();
        if (dict && customWords.length > 0) {
          customWords.forEach((w: string) => dict.add(w));
          console.log(`[Словарь] Добавлено ${customWords.length} новых слов из базы`);
        }
      }
    });

    // Поллинг активного испытания (каждые 30 секунд)
    const checkChallenge = () => {
      if (!getActiveChallenge) return;
      getActiveChallenge().then((data: any) => {
        if (data) {
          setCurrentChallengeId(prev => (prev !== data.id ? data.id : prev));
          
          setChallengeLetters((prev: any) => {
             if (JSON.stringify(prev) !== JSON.stringify(data.letters)) return data.letters;
             return prev;
          });
          
          setChallengeEndTime(prev => (prev !== data.endTime ? data.endTime : prev));
        }
      });
    };

    checkChallenge(); // Первый запуск
    const interval = setInterval(checkChallenge, 30000); // Проверка каждые 30 сек
    return () => clearInterval(interval);

  }, [fetchCustomWords, getActiveChallenge]);

  useEffect(() => {
    localStorage.setItem('slovodel_total_score', totalScore.toString());
    localStorage.setItem('slovodel_high_score', highScore.toString());
    localStorage.setItem('slovodel_rare_words', JSON.stringify(rareWords));
    localStorage.setItem('slovodel_total_words', totalWords.toString());
    localStorage.setItem('slovodel_coins', coins.toString());
  }, [totalScore, highScore, rareWords, totalWords]);

  // Синхронизация бонусов с localStorage
  useEffect(() => { localStorage.setItem('slovodel_bonus_time', bonusTimeLeft.toString()); }, [bonusTimeLeft]);
  useEffect(() => { localStorage.setItem('slovodel_bonus_swap', bonusSwapLeft.toString()); }, [bonusSwapLeft]);
  useEffect(() => { localStorage.setItem('slovodel_bonus_hint', bonusHintLeft.toString()); }, [bonusHintLeft]);
  useEffect(() => { localStorage.setItem('slovodel_bonus_wildcard', bonusWildcardLeft.toString()); }, [bonusWildcardLeft]);

  // Загрузка данных пользователя из БД при старте
  useEffect(() => {
    if (tgUser?.id && getUserData) {
      getUserData(tgUser.id).then((data: any) => {
        if (data) { // Существующий пользователь
          // Полностью перезаписываем локальные данные данными из БД
          setTotalScore(data.score ?? 0);
          setCoins(data.coins ?? 0);
          
          // Бонусы (с фолбэком на случай, если в БД их еще нет)
          setBonusTimeLeft(data.bonus_time ?? 2);
          setBonusHintLeft(data.bonus_hint ?? 2);
          setBonusSwapLeft(data.bonus_swap ?? 2);
          setBonusWildcardLeft(data.bonus_wildcard ?? 2);

          // Редкие слова
          setRareWords(Array.isArray(data.rare_words) ? data.rare_words : []);

          // Статистика
          setTotalWords(data.total_words ?? 0);
          
          // Синхронизируем серию, ТОЛЬКО если данные в облаке свежие (сегодня или вчера)
          if ((data.streak ?? 0) > streak) {
            const lastUpdate = data.updated_at ? new Date(data.updated_at) : new Date(0);
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);

            // Сравниваем даты (день, месяц, год)
            const isToday = lastUpdate.toDateString() === now.toDateString();
            const isYesterday = lastUpdate.toDateString() === yesterday.toDateString();

            if (isToday || isYesterday) {
              setStreak(data.streak);
              localStorage.setItem('slovodel_streak_count', data.streak.toString());
            }
          }
          
          // Новые поля статистики (предполагаем, что они будут в БД)
          setDaysPlayed(data.days_played ?? 0);
          setDailyPlaces({
            first: data.daily_1_place ?? 0,
            second: data.daily_2_place ?? 0,
            third: data.daily_3_place ?? 0
          });

          // Загружаем место в рейтинге
          if (fetchUserRank) {
            fetchUserRank(tgUser.id).then((rankData: any) => {
              if (rankData && typeof rankData.rank === 'number') {
                setUserRank(rankData.rank);
              }
            });
          }

        } else { // Новый пользователь (или первый запуск)
          // Сбрасываем все значения до дефолтных, чтобы не использовать чужие данные из localStorage
          setTotalScore(0);
          setHighScore(0);
          setRareWords([]);
          setCoins(0); // Новым игрокам можно дать приветственный бонус, например 50
          setBonusTimeLeft(2);
          setBonusHintLeft(2);
          setBonusSwapLeft(2);
          setBonusWildcardLeft(2);
          setTotalWords(0);
          setDaysPlayed(0);
          setDailyPlaces({ first: 0, second: 0, third: 0 });
        }
      }).catch((err:any) => {
        console.warn("Не удалось загрузить профиль (возможно, нет сети). Используем локальные данные.", err);
        // Не сбрасываем очки! Оставляем значения из localStorage.
      });

      // Загружаем актуальное состояние ежедневного испытания (бонусы)
      if (getUserDailyScore) {
        getUserDailyScore(tgUser.id, currentChallengeId).then((data: any) => {
          if (data) {
             setDailyStatus(prev => ({
               ...prev,
               challengeId: currentChallengeId,
               scores: data.level_scores || prev.scores,
               // Обновляем бонусы из базы, так как они надежнее локальных
               bonuses: {
                 time: data.bonus_time ?? 2,
                 hint: data.bonus_hint ?? 2,
                 swap: data.bonus_swap ?? 2,
                 wildcard: data.bonus_wildcard ?? 2
               }
             }));
          } else {
             // Если данных нет, значит это новое испытание -> сбрасываем статус
             setDailyStatus(prev => {
                if (prev.challengeId !== currentChallengeId) {
                    return {
                        challengeId: currentChallengeId,
                        scores: {},
                        userId: tgUser.id,
                        bonuses: { time: 1, hint: 1, swap: 1, wildcard: 1 }
                    };
                }
                return prev;
             });
          }
        });
      }
    }
  }, [tgUser, getUserData, getUserDailyScore, currentChallengeId, fetchUserRank]);

  const finishGame = useCallback(() => {
    const finalScore = score;
    const oldHighScore = highScore;
    const newTotalScore = totalScore + finalScore;

    // Проверяем повышение ранга
    const oldRank = getUserRank(totalScore);
    const newRank = getUserRank(newTotalScore);
    if (oldRank !== newRank) {
      setNewRankReached(newRank);
    } else {
      setNewRankReached(null);
    }
    
    // Вычисляем новые значения статистики ДО сохранения
    let currentStreak = streak;
    let currentDaysPlayed = daysPlayed;
    const today = getDailyDateString();

    if (!hasPlayedToday) {
      currentStreak = streak + 1;
      currentDaysPlayed = daysPlayed + 1;
    }

    const currentHighScore = finalScore > highScore ? finalScore : highScore;

    setTotalScore(newTotalScore);
    
    // Определяем, какие бонусы сохранять (если играли дейлик, то сохраняем старые бонусы из рефа)
    const bonusesToSave = isDailyMode ? userBonusesRef.current : {
      time: bonusTimeLeft,
      hint: bonusHintLeft,
      swap: bonusSwapLeft,
      wildcard: bonusWildcardLeft
    };
    
    // Текущие бонусы дейлика для сохранения в daily_scores
    const currentDailyBonuses = {
      time: bonusTimeLeft,
      hint: bonusHintLeft,
      swap: bonusSwapLeft,
      wildcard: bonusWildcardLeft
    };

    // Сохраняем очки и обрабатываем возможные ошибки (например, если нет интернета)
    Promise.resolve(saveUserData({
      telegramId: tgUser?.id,
      username: USER_NAME,
      score: newTotalScore,
      bonuses: bonusesToSave,
      avatarUrl: tgUser?.photo_url,
      rareWords: rareWords,
      totalWords: totalWords,
      highScore: currentHighScore,
      daysPlayed: currentDaysPlayed,
      streak: currentStreak,
      coins: coins
    })).catch((err: any) => {
      console.error("Ошибка сохранения рекорда:", err);
    });

    if (finalScore > oldHighScore) {
      setHighScore(finalScore);
      setLastRoundRecordBeaten(finalScore - oldHighScore);
    } else {
      setLastRoundRecordBeaten(null);
    }

    if (!hasPlayedToday) {
      setStreak(currentStreak);
      setDaysPlayed(currentDaysPlayed);
      setHasPlayedToday(true);
      localStorage.setItem('slovodel_streak_count', currentStreak.toString());
      localStorage.setItem('slovodel_streak_date', today);

      const title = getStreakTitle(currentStreak);
      if ([3, 7, 14, 30].includes(currentStreak)) {
        setStreakMilestone(title);
        
        // Множитель награды за серию
        let mult = 1;
        if (currentStreak >= 30) mult = 5;
        else if (currentStreak >= 14) mult = 3;
        else if (currentStreak >= 7) mult = 2;

        const reward = generateRandomReward(mult);
        setPendingRewards(prev => [...prev, { achievement: `Серия: ${currentStreak} дней!`, reward }]);
      } else {
        showToast('Твой внутренний филолог в огне! 🔥 Продолжай в том же духе!', 'good');
      }
    }

    if (isDailyMode) {
      const level = grid.length; // 10, 8 или 6
      const newScores = { ...dailyStatus.scores, [level]: finalScore };
      const info = { challengeId: currentChallengeId, scores: newScores, bonuses: currentDailyBonuses, userId: tgUser?.id };
      
      setDailyStatus(info);
      localStorage.setItem('slovodel_daily_play_v2', JSON.stringify(info));
      
      const totalDailyScore = Object.values(newScores).reduce((a, b) => a + b, 0);

      // Сохраняем результат в таблицу ежедневного рейтинга
      if (saveDailyScore && tgUser?.id) {
        saveDailyScore({
          telegramId: tgUser.id,
          username: USER_NAME,
          avatarUrl: tgUser.photo_url,
          score: totalDailyScore,
          challengeId: currentChallengeId,
          bonuses: currentDailyBonuses,
          levelScores: newScores
        });
      }
    }

    setShowConfirm(false);
    setIsMenuOpen(false);

    // Восстанавливаем бонусы пользователя после дейлика
    if (isDailyMode) {
      setBonusTimeLeft(userBonusesRef.current.time);
      setBonusHintLeft(userBonusesRef.current.hint);
      setBonusSwapLeft(userBonusesRef.current.swap);
      setBonusWildcardLeft(userBonusesRef.current.wildcard);
    }

    setWildcardActiveSeconds(0);
    setHintActiveSeconds(0);
    setHintRevealLeft(0);
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
    setStatus('results');
  }, [score, USER_NAME, saveUserData, saveDailyScore, highScore, totalScore, bonusTimeLeft, bonusHintLeft, bonusSwapLeft, bonusWildcardLeft, tgUser, rareWords, streak, hasPlayedToday, isDailyMode, playSfx, showToast, tg, totalWords, currentChallengeId, daysPlayed, dailyStatus.scores]);

  const handleClaimReward = () => {
    if (!activeReward) return;
    const { type, amount } = activeReward.reward;
    switch (type) {
        case 'time': setBonusTimeLeft(prev => prev + amount); break;
        case 'hint': setBonusHintLeft(prev => prev + amount); break;
        case 'swap': setBonusSwapLeft(prev => prev + amount); break;
        case 'wildcard': setBonusWildcardLeft(prev => prev + amount); break;
        case 'coins': setCoins(prev => prev + amount); break; // Если награда в монетах
    }
    playSfx('bonus');
    setActiveReward(null);
  };

  // Эффект для показа отложенных наград в меню
  useEffect(() => {
    if (status === 'menu' && pendingRewards.length > 0) {
      if (!activeReward && !streakMilestone && !isMenuOpen && !isAboutOpen && !isAchievementsOpen && !showCollection && !isShopOpen && !isDailyChallengeOpen && !showGlobalRanking) {
        const next = pendingRewards[0];
        setActiveReward(next);
        setPendingRewards(prev => prev.slice(1));
        playSfx('reward_fanfare');
      }
    }
  }, [status, pendingRewards, activeReward, streakMilestone, isMenuOpen, isAboutOpen, isAchievementsOpen, showCollection, isShopOpen, isDailyChallengeOpen, showGlobalRanking, playSfx]);

  useEffect(() => {
    let interval: number;
    if (status === 'playing' && timeLeft > 0 && !isMenuOpen && !isAboutOpen && !isShopOpen && swapTargetIdx === null) {
      interval = window.setInterval(() => {
        setTimeLeft(t => t - 1);
        setWildcardActiveSeconds(ws => Math.max(0, ws - 1));
        
        if (hintActiveSeconds > 0) {
          setHintActiveSeconds(hs => hs - 1);
        } else if (hintRevealLeft > 0) {
          setHintRevealLeft(hr => hr - 1);
        }
      }, 1000);
    } else if (timeLeft === 0 && status === 'playing') {
      finishGame();
    }
    return () => clearInterval(interval);
  }, [status, timeLeft, isMenuOpen, isAboutOpen, isShopOpen, finishGame, swapTargetIdx, hintActiveSeconds, hintRevealLeft]);

  const startGame = (difficultyLevel: number, daily: boolean = false) => {
    if (isDictLoading) return;
    playSfx('click');
    // Множитель теперь зависит от сложности и в обычном, и в ежедневном режиме
    setMultiplier(difficultyLevel === 10 ? 1 : difficultyLevel === 8 ? 1.5 : 2);
    setIsDailyMode(daily);
    setIsDailyChallengeOpen(false);

    if (daily) {
      // Сохраняем текущие бонусы и выдаем фиксированный набор для дейлика
      userBonusesRef.current = {
        time: bonusTimeLeft,
        hint: bonusHintLeft,
        swap: bonusSwapLeft,
        wildcard: bonusWildcardLeft
      };
      
      // Если есть сохраненные бонусы для дейлика на сегодня — используем их, иначе даем по 1
      const dailyBonuses = (dailyStatus.challengeId === currentChallengeId && dailyStatus.bonuses) 
        ? dailyStatus.bonuses 
        : { time: 1, hint: 1, swap: 1, wildcard: 1 };

      setBonusTimeLeft(dailyBonuses.time);
      setBonusHintLeft(dailyBonuses.hint);
      setBonusSwapLeft(dailyBonuses.swap);
      setBonusWildcardLeft(dailyBonuses.wildcard);
    }

    // Если это дейлик и у нас есть загруженные буквы - используем их
    // Иначе генерируем новые (для обычной игры)
    const startGrid = (daily && challengeLetters) 
      ? challengeLetters[difficultyLevel] 
      : generateGrid(difficultyLevel);

    setGrid(startGrid);
    setFoundWords([]);
    setCurrentInput([]);
    setScore(0);
    setTimeLeft(60);
    // Бонусы больше не сбрасываются здесь! Они берутся из общего инвентаря.
    setWildcardActiveSeconds(0);
    setHintActiveSeconds(0);
    setHintRevealLeft(0);
    setSwapTargetIdx(null);
    setIsSwapActive(false);
    setHintWord(null);
    setHintDefinition(null);
    setUsedHints(new Set());
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
      const finalPoints = Math.round(targetWord.length * 10 * multiplier);

      if (targetWord.length >= 7) {
        playSfx('rare_success');
        const lowerText = targetWord.toLowerCase();
        const existingIndex = rareWords.findIndex(r => r.text === lowerText);

        if (existingIndex === -1) {
          showToast(`✨ НОВАЯ РЕДКОСТЬ: ${targetWord.toUpperCase()}!`, 'good');
          const newRareWords = [...rareWords, { text: lowerText, length: targetWord.length, score: finalPoints }];
          setRareWords(newRareWords);
          
          if (newRareWords.length % 5 === 0) {
             const reward = generateRandomReward();
             setPendingRewards(prev => [...prev, { achievement: `Коллекционер: ${newRareWords.length} слов!`, reward }]);
             playSfx('reward_fanfare');
          }
        } else {
          if (finalPoints > rareWords[existingIndex].score) {
            showToast(`🔥 РЕКОРД ОБНОВЛЕН: ${targetWord.toUpperCase()}!`, 'good');
            setRareWords(prev => prev.map((w, i) => i === existingIndex ? { ...w, score: finalPoints } : w));
          } else {
            showToast(`🌟 РЕДКОЕ СЛОВО: ${targetWord.toUpperCase()}!`, 'good');
          }
        }
      } else {
        playSfx('success');
        showToast(`+${finalPoints}`, 'good');
      }

      setFoundWords(prev => [{ text: targetWord, score: finalPoints }, ...prev]);
      setScore(s => s + finalPoints);
      setTotalWords(prev => prev + 1);

      if (hintWord && targetWord === hintWord.toLowerCase()) {
        setHintWord(null);
        setHintDefinition(null);
        setHintActiveSeconds(0);
        setHintRevealLeft(0);
      }
      setCurrentInput([]);
    } else {
      playSfx('error');
      showToast('Нет такого слова', 'bad');
      setCurrentInput([]);
    }
  };

  const openGlobalRanking = async (initialTab: 'all' | 'daily' | 'previous' = 'all') => {
    playSfx('click');
    setShowGlobalRanking(true);
    setLeaderboardTab(initialTab);
    setGlobalData([]);
    setCurrentUserRank(null);
    setTotalPlayersCount(0);
    setIsLeaderboardLoading(true);

    try {
      if (initialTab === 'all') {
        const { players, count } = await getLeaderboard();
        setGlobalData(players);
        setTotalPlayersCount(count);

        if (tgUser?.id && fetchUserRank) {
          const isPlayerInTop = players.some((player: any) => player.telegram_id === tgUser.id);
          if (!isPlayerInTop) {
            const rankData = await fetchUserRank(tgUser.id);
            if (rankData) {
              setCurrentUserRank(rankData);
            }
          }
        }
      } else if (initialTab === 'daily') {
        const { players, count } = await getDailyLeaderboard(currentChallengeId);
        setGlobalData(players);
        setTotalPlayersCount(count);
      } else {
        const { players, count } = await fetchPreviousDailyLeaderboard(currentChallengeId);
        setGlobalData(players);
        setTotalPlayersCount(count);
      }
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const handleLeaderboardTabChange = async (tab: 'all' | 'daily' | 'previous') => {
    playSfx('click');
    setLeaderboardTab(tab);
    setGlobalData([]);
    setCurrentUserRank(null);
    setTotalPlayersCount(0);
    setIsLeaderboardLoading(true);

    try {
      if (tab === 'all') {
        const { players, count } = await getLeaderboard();
        setGlobalData(players);
        setTotalPlayersCount(count);
        // Логика ранга для общего рейтинга уже есть выше, можно вынести в функцию
      } else if (tab === 'daily') {
        const { players, count } = await getDailyLeaderboard(currentChallengeId);
        setGlobalData(players);
        setTotalPlayersCount(count);
        // Для ежедневного рейтинга ранг можно не показывать отдельно, или реализовать get_daily_player_rank в SQL
      } else {
        const { players, count } = await fetchPreviousDailyLeaderboard(currentChallengeId);
        setGlobalData(players);
        setTotalPlayersCount(count);
      }
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const handleLeaderboardPlayerClick = async (player: any) => {
    playSfx('click');
    // Если кликнули на себя — открываем свое окно достижений
    if (player.telegram_id === tgUser?.id) {
      setIsAchievementsOpen(true);
      return;
    }

    // Загружаем данные другого игрока
    if (getUserData) {
      try {
        const data = await getUserData(player.telegram_id);
        let rank = 0;
        if (fetchUserRank) {
             const r = await fetchUserRank(player.telegram_id);
             if (r && typeof r.rank === 'number') rank = r.rank;
        }
        if (data) {
           setOtherUserProfile({ ...data, rank });
        }
      } catch (e) {
        console.error("Не удалось загрузить профиль игрока", e);
      }
    }
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

  //Поиск определения слова
  const fetchWordDefinition = async (word: string) => {
    setIsDefinitionLoading(true);
    try {
      // 1. Запрашиваем содержимое страницы через revisions
      // redirects=1 автоматически перенаправит с "Арбуз" на "арбуз"
      const url = `https://ru.wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent(word.toLowerCase())}&redirects=1&format=json&origin=*`;

      const response = await fetch(url);
      const data = await response.json();

      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];

      if (pageId === "-1") {
        setHintDefinition("Слово не найдено в словаре.");
        return;
      }

      // Получаем текст всей страницы
      const wikitext = pages[pageId].revisions[0].slots.main["*"];

      // 2. Ищем строку определения. В Викисловаре это строка, начинающаяся с "# "
      // Регулярное выражение ищет первую такую строку
      const match = wikitext.match(/#\s*([^{#\n][^#\n]+)/);

      if (match && match[1]) {
        let definition = match[1]
          .replace(/\[\[|\]\]/g, "") // Убираем ссылки [[слово]]
          .replace(/\{\{[^}]+\}\}/g, "") // Убираем шаблоны {{значение|...}}
          .replace(/''+/g, "") // Убираем курсив/жирный текст
          .trim();

        // Если после очистки что-то осталось, берем первое предложение
        if (definition) {
          setHintDefinition(definition.split('.')[0] + ".");
        } else {
          setHintDefinition("Значение найдено, но его сложно отобразить кратко.");
        }
      } else {
        setHintDefinition("Не удалось извлечь краткое определение.");
      }
    } catch (e) {
      console.error("Ошибка словаря:", e);
      setHintDefinition("Ошибка подключения к Викисловарю.");
    } finally {
      setIsDefinitionLoading(false);
    }
  };

  const handleHint = async () => {
    if (bonusHintLeft <= 0) return;
    const dictionary = getDictionary();
    if (!dictionary) return;

    const availableStr = grid.join('').toLowerCase();
    const possibleWords: string[] = [];
    const foundSet = new Set(foundWords.map(w => w.text.toLowerCase()));

    // Сохраняем текущую подсказку в нижнем регистре для сравнения
    const currentHintLower = hintWord?.toLowerCase();

    for (const word of dictionary) {
      // ДОБАВЛЕНО УСЛОВИЕ: word !== currentHintLower
      // Это исключает текущее слово-подсказку из списка кандидатов
      if (word.length < 3 || word.length > 5 || foundSet.has(word) || word === currentHintLower || usedHints.has(word)) continue;

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

      // Сортируем по длине (как в вашем оригинальном коде)
      possibleWords.sort((a, b) => b.length - a.length);

      // Берем самое длинное из доступных (которое не является текущим)
      let nextHint = possibleWords[0];

      setUsedHints(prev => new Set(prev).add(nextHint));
      setHintWord(nextHint.toUpperCase());
      setHintDefinition(null);
      setBonusHintLeft(prev => prev - 1);
      setHintActiveSeconds(20);
      setHintRevealLeft(5);
      showToast('Другое слово!', 'good');
      fetchWordDefinition(nextHint);
    } else {
      playSfx('error');
      showToast('Других слов нет', 'bad');
    }
  };

  const toggleSwapMode = () => {
    if (bonusSwapLeft <= 0) return;
    if (hintActiveSeconds > 0) {
      playSfx('error');
      showToast('Нельзя менять буквы во время подсказки!', 'bad');
      return;
    }
    playSfx('click');
    if (!isSwapActive) {
      showToast('Выберите букву, для замены', 'good');
    }
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
    if (!/[А-ЯЁ]/.test(char)) {
      if (char.length > 0) {
        playSfx('error');
        showToast('Только кириллица!', 'bad');
      }
      return;
    }
    if (grid.includes(char)) {
      playSfx('error');
      showToast('Такая буква уже есть!', 'bad');
      return;
    }

    playSfx('bonus');
    const newGrid = [...grid];
    newGrid[swapTargetIdx] = char;
    setGrid(newGrid);
    setBonusSwapLeft(prev => prev - 1);
    setSwapTargetIdx(null);
  };

  // Функция покупки пакета бонусов
  const handleBuyBonuses = (items: { type: 'time' | 'hint' | 'swap' | 'wildcard', cost: number, amount: number }[]): boolean => {
    const totalCost = items.reduce((sum, item) => sum + item.cost, 0);

    if (coins >= totalCost) {
      const newCoins = coins - totalCost;
      setCoins(newCoins);

      let newTime = bonusTimeLeft;
      let newHint = bonusHintLeft;
      let newSwap = bonusSwapLeft;
      let newWildcard = bonusWildcardLeft;

      items.forEach(item => {
        switch (item.type) {
          case 'time': newTime += item.amount; break;
          case 'hint': newHint += item.amount; break;
          case 'swap': newSwap += item.amount; break;
          case 'wildcard': newWildcard += item.amount; break;
        }
      });

      setBonusTimeLeft(newTime);
      setBonusHintLeft(newHint);
      setBonusSwapLeft(newSwap);
      setBonusWildcardLeft(newWildcard);

      playSfx('bonus');
      showToast(`Куплено бонусов: ${items.reduce((a, i) => a + i.amount, 0)}`, 'good');
      
      // Сохраняем сразу, чтобы не потерять прогресс при закрытии
      saveUserData({
        telegramId: tgUser?.id,
        username: USER_NAME,
        score: totalScore,
        bonuses: { time: newTime, hint: newHint, swap: newSwap, wildcard: newWildcard },
        rareWords, totalWords, highScore, daysPlayed, streak,
        coins: newCoins
      });
      return true;
    } else {
      playSfx('error');
      showToast('Недостаточно монет!', 'bad');
      return false;
    }
  };

  const isCurrentChallenge = dailyStatus.challengeId === currentChallengeId;
  const dailyLevelsDone = isCurrentChallenge && dailyStatus.scores ? Object.keys(dailyStatus.scores).map(Number) : [];
  const isDailyFullComplete = isCurrentChallenge && [10, 8, 6].every(l => dailyStatus.scores && Object.prototype.hasOwnProperty.call(dailyStatus.scores, l));
  const currentDailyScore = isCurrentChallenge && dailyStatus.scores ? Object.values(dailyStatus.scores).reduce((a, b) => a + b, 0) : 0;

  if (isDictLoading) {
    return (
      // Используем тот же фон, что и в основной игре, чтобы не было "бледности" при загрузке
      <div className="app-wrapper items-center justify-center p-6">
        <div className="logo-loading text-gradient-custom drop-shadow-lg mb-8 animate-pulse"></div>
        <div className="spinner w-8 h-8 text-indigo-600 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm opacity-50 mt-4 text-gray-900 dark:text-white font-bold uppercase tracking-widest">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {isMenuOpen && (
        <SettingsMenu
          musicVolume={musicVolume} setMusicVolume={setMusicVolume}
          sfxVolume={sfxVolume} setSfxVolume={setSfxVolume}
          theme={theme} setTheme={setTheme}
          onClose={() => setIsMenuOpen(false)}
          onExit={() => setShowConfirm(true)}
          playSfx={playSfx}
          showExitButton={status === 'playing'}
          isAdmin={tgUser?.id ? ADMIN_IDS.includes(tgUser.id) : false}
          onOpenAdmin={() => { setIsMenuOpen(false); setStatus('admin'); }}
        />
      )}
      {isAboutOpen && (
        <AboutSection 
          onClose={() => setIsAboutOpen(false)} 
          playSfx={playSfx} 
          bonuses={{
            time: bonusTimeLeft,
            hint: bonusHintLeft,
            swap: bonusSwapLeft,
            wildcard: bonusWildcardLeft
          }}
          onOpenShop={() => { setIsAboutOpen(false); setShopPreviousScreen('about'); setIsShopOpen(true); }}
          showRanks={status !== 'playing'}
          onSubmitFeedback={(msg) => saveFeedback && saveFeedback({
            telegramId: tgUser?.id,
            username: USER_NAME,
            message: msg
          })}
          isDailyMode={isDailyMode}
        />
      )}
      {activeReward && (
        <RewardModal
          achievement={activeReward.achievement}
          reward={activeReward.reward}
          onClose={handleClaimReward}
          playSfx={playSfx}
        />
      )}
      {showCollection && <CollectionModal words={rareWords} onClose={() => setShowCollection(false)} playSfx={playSfx} />}
      {isShopOpen && <ShopModal 
        coins={coins}
        onBuyBonuses={handleBuyBonuses}
        initialTab={shopInitialTab}
        onClose={() => { 
        setIsShopOpen(false); 
        setShopInitialTab('bonuses');
        if (shopPreviousScreen === 'about') setIsAboutOpen(true);
        else if (shopPreviousScreen === 'achievements') setIsAchievementsOpen(true);
      }} playSfx={playSfx} />}
      {status === 'admin' && (
        <AdminPanelModal 
          onClose={() => setStatus('menu')} 
          playSfx={playSfx} 
          fetchFeedbacks={fetchFeedbacks} 
          addCustomWord={(w) => addCustomWord(w, tgUser?.id)}
          fetchAdminCustomWords={fetchAdminCustomWords}
          deleteCustomWord={deleteCustomWord}
          updateCustomWord={updateCustomWord}
          onReply={sendFeedbackReply}
          onArchive={archiveFeedback}
          onDelete={deleteFeedback}
          onBroadcast={sendBroadcast}
          onTestModal={handleTestModal}
        />
      )}
      {isDailyChallengeOpen && (
        <DailyChallengeModal 
          onClose={() => setIsDailyChallengeOpen(false)}
          onStart={(level) => startGame(level, true)}
          playSfx={playSfx}
          completedLevels={dailyLevelsDone}
          currentScore={currentDailyScore}
        />
      )}
      {showGlobalRanking && <LeaderboardModal
        data={globalData}
        onClose={() => setShowGlobalRanking(false)}
        playSfx={playSfx}
        currentUserId={tgUser?.id}
        currentUserRankData={currentUserRank}
        userScore={leaderboardTab === 'all' ? totalScore : currentDailyScore}
        totalPlayers={totalPlayersCount}
        getUserRank={getUserRank}
        activeTab={leaderboardTab}
        onTabChange={handleLeaderboardTabChange}
        isLoading={isLeaderboardLoading}
        onPlayerClick={handleLeaderboardPlayerClick}
      />}
      {isAchievementsOpen && (
        <AchievementsModal 
          onClose={() => setIsAchievementsOpen(false)} 
          playSfx={playSfx}
          username={USER_NAME}
          avatarUrl={tgUser?.photo_url}
          rank={getUserRank(totalScore)}
          totalScore={totalScore}
          highScore={highScore}
          streak={streak}
          totalWords={totalWords}
          rareWords={rareWords}
          bonuses={{
            time: bonusTimeLeft,
            hint: bonusHintLeft,
            swap: bonusSwapLeft,
            wildcard: bonusWildcardLeft
          }}
          onOpenShop={(tab) => { 
            setIsAchievementsOpen(false); 
            setShopPreviousScreen('achievements'); 
            if (tab) setShopInitialTab(tab);
            setIsShopOpen(true); 
          }}
          place={userRank}
          daysPlayed={daysPlayed}
          dailyPlaces={dailyPlaces}
          coins={coins}
        />
      )}
      {otherUserProfile && (
        <AchievementsModal 
          onClose={() => setOtherUserProfile(null)} 
          playSfx={playSfx}
          username={otherUserProfile.username || 'Игрок'}
          avatarUrl={otherUserProfile.avatar_url}
          rank={getUserRank(Number(otherUserProfile.score) || 0)}
          totalScore={Number(otherUserProfile.score) || 0}
          highScore={otherUserProfile.high_score || 0}
          streak={otherUserProfile.streak || 0}
          totalWords={otherUserProfile.total_words || 0}
          rareWords={otherUserProfile.rare_words || []}
          bonuses={{ time: 0, hint: 0, swap: 0, wildcard: 0 }} // Заглушка, не отображается
          onOpenShop={() => {}}
          place={otherUserProfile.rank || 0}
          daysPlayed={otherUserProfile.days_played || 0}
          dailyPlaces={{
            first: otherUserProfile.daily_1_place || 0,
            second: otherUserProfile.daily_2_place || 0,
            third: otherUserProfile.daily_3_place || 0
          }}
          coins={0} // Заглушка
          isPublicView={true}
        />
      )}

      {status === 'menu' && (
        <MainMenu
          streak={streak}
          streakMilestone={streakMilestone}
          setStreakMilestone={setStreakMilestone}
          hasPlayedToday={hasPlayedToday}
          openGlobalRanking={() => openGlobalRanking('all')}
          openAchievements={() => setIsAchievementsOpen(true)}
          playSfx={playSfx}
          setShowCollection={setShowCollection}
          onOpenAbout={() => setIsAboutOpen(true)}
          setIsMenuOpen={setIsMenuOpen}
          userName={USER_NAME}
          totalScore={totalScore}
          highScore={highScore}
          isDailyPlayedToday={isDailyFullComplete}
          startGame={startGame}
          openDailyChallenge={() => isDailyFullComplete ? openGlobalRanking('daily') : setIsDailyChallengeOpen(true)}
          dailyScore={currentDailyScore}
          challengeId={currentChallengeId}
          challengeEndTime={challengeEndTime}
          coins={coins}
          onOpenShop={(tab) => {
            if (tab) setShopInitialTab(tab);
            setIsShopOpen(true);
          }}
        />
      )}

      {status === 'results' && (
        <ResultsScreen
          score={score}
          lastRoundRecordBeaten={lastRoundRecordBeaten}
          totalScore={totalScore}
          userName={USER_NAME}
          onMenu={() => { 
            setStatus('menu'); 
            tg?.MainButton.hide();
            if (isDailyMode) {
              if (!isDailyFullComplete) {
                setIsDailyChallengeOpen(true);
              }
              setIsDailyMode(false);
            }
          }}
          newRankReached={newRankReached}
          onRankModalClose={() => {
            if (newRankReached) {
              const mult = getRankMultiplier(newRankReached);
              const reward = generateRandomReward(mult);
              setPendingRewards(prev => [...prev, { achievement: `За достижение звания!`, reward }]);
            }
          }}
        />
      )}

      {status === 'playing' && (
        <GameScreen
          score={score}
          isDailyMode={isDailyMode}
          timeLeft={timeLeft}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
          hintWord={hintWord}
          isDefinitionLoading={isDefinitionLoading}
          hintDefinition={hintDefinition}
          foundWords={foundWords}
          currentInput={currentInput}
          setCurrentInput={setCurrentInput}
          playSfx={playSfx}
          handleAddTime={handleAddTime}
          bonusTimeLeft={bonusTimeLeft}
          handleHint={handleHint}
          bonusHintLeft={bonusHintLeft}
          handleWildcard={handleWildcard}
          bonusWildcardLeft={bonusWildcardLeft}
          wildcardActiveSeconds={wildcardActiveSeconds}
          hintActiveSeconds={hintActiveSeconds}
          toggleSwapMode={toggleSwapMode}
          bonusSwapLeft={bonusSwapLeft}
          isSwapActive={isSwapActive}
          grid={grid}
          hintIndices={hintIndices}
          startSwap={startSwap}
          checkWord={checkWord}
          performSwap={performSwap}
          swapTargetIdx={swapTargetIdx}
          setSwapTargetIdx={setSwapTargetIdx}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
          finishGame={finishGame}
          setGrid={setGrid}
          onOpenShop={() => { setShopPreviousScreen(null); setIsShopOpen(true); }}
        />
      )}

      {/* Глобальные уведомления (Тосты) */}
      {message && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-bold text-white shadow-2xl z-[1000] animate-bounce text-center backdrop-blur-md border border-white/20 ${message?.type === 'good' ? 'bg-indigo-600/90' : 'bg-red-500/90'}`}>
          {message?.text}
        </div>
      )}
    </div>
  );
}