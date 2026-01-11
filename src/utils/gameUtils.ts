import { RARE_LIST, VOWELS_UNIQUE, COMMON_CONSONANTS } from './constants';

// Длительность испытания (10 минут).
export const CHALLENGE_PERIOD_MS = 10 * 60 * 1000;

export const getSeedFromDate = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export const createSeededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export const getSeedFromChallengeId = (challengeId: string) => {
  let hash = 0;
  for (let i = 0; i < challengeId.length; i++) {
    hash = ((hash << 5) - hash) + challengeId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getCurrentChallengeId = () => {
  return Math.floor(Date.now() / CHALLENGE_PERIOD_MS).toString();
};

export const getDailyDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const calculateStreakStatus = () => {
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

export const getStreakTitle = (s: number) => {
  if (s >= 30) return "Повелитель буквенного пламени";
  if (s >= 14) return "Огненный лингвист";
  if (s >= 7) return "Пламя знаний";
  if (s >= 3) return "Искра слова";
  return null;
};

export const getUserRank = (points: number) => {
  if (points < 2000) return "Новичок-грамотей";
  if (points < 5000) return "Книжный червь";
  if (points < 10000) return "Буквенный следопыт";
  if (points < 20000) return "Словесный скаут";
  if (points < 50000) return "Адепт алфавита";
  if (points < 100000) return "Мастер слов";
  if (points < 200000) return "Магистр букв";
  if (points < 500000) return "Живая энциклопедия";
  return "Оракул Словодела";
};

export const formatTime = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getLevelProgress = (s: number) => {
  if (s < 2000) return (s / 2000) * 100;
  if (s < 5000) return ((s - 2000) / 3000) * 100;
  if (s < 10000) return ((s - 5000) / 5000) * 100;
  if (s < 20000) return ((s - 10000) / 10000) * 100;
  if (s < 50000) return ((s - 20000) / 30000) * 100;
  if (s < 100000) return ((s - 50000) / 50000) * 100;
  if (s < 200000) return ((s - 100000) / 100000) * 100;
  if (s < 500000) return ((s - 200000) / 300000) * 100;
  return 100;
};

export const getNextLevelTarget = (s: number) => {
  if (s < 2000) return 2000;
  if (s < 5000) return 5000;
  if (s < 10000) return 10000;
  if (s < 20000) return 20000;
  if (s < 50000) return 50000;
  if (s < 100000) return 100000;
  if (s < 200000) return 200000;
  if (s < 500000) return 500000;
  return null;
};

export const generateGrid = (level: number, seed?: number) => {
  const letters = new Set<string>();
  let rareCount = 0;
  
  const rand = seed !== undefined ? createSeededRandom(seed) : Math.random;

  // 1. Набор гласных
  const targetVowels = level === 10 ? 4 : level === 8 ? 3 : 2;
  const vowelsPool = VOWELS_UNIQUE.split('').sort(() => (seed !== undefined ? rand() - 0.5 : Math.random() - 0.5));
  for (const v of vowelsPool) {
    if (letters.size >= targetVowels) break;
    letters.add(v);
  }

  const rareChance = rand() < 0.3;

  // 2. Набор согласных
  const consPool = (COMMON_CONSONANTS + RARE_LIST).split('').sort(() => (seed !== undefined ? rand() - 0.5 : Math.random() - 0.5));

  for (const c of consPool) {
    if (letters.size >= level) break;

    if (RARE_LIST.includes(c)) {
      if (rareChance && rareCount < 1) {
        letters.add(c);
        rareCount++;
      }
    } else {
      letters.add(c);
    }
  }

  if (letters.size < level) {
    const backupPool = COMMON_CONSONANTS.split('').sort(() => (seed !== undefined ? rand() - 0.5 : Math.random() - 0.5));
    for (const b of backupPool) {
      if (letters.size >= level) break;
      letters.add(b);
    }
  }

  return Array.from(letters).sort(() => (seed !== undefined ? rand() - 0.5 : Math.random() - 0.5));
};

export const generateRandomReward = (multiplier: number = 1): { type: 'time' | 'hint' | 'swap' | 'wildcard', amount: number } => {
  const rand = Math.random();
  let type: 'time' | 'hint' | 'swap' | 'wildcard';
  let baseAmount = 1;

  // Вероятности: Время (30%), Замена (27%), Джокер (25%), Слово (18%)
  if (rand < 0.30) {
    type = 'time';
    baseAmount = Math.random() < 0.5 ? 1 : 2;
  } else if (rand < 0.57) {
    type = 'swap';
    baseAmount = Math.random() < 0.5 ? 1 : 2;
  } else if (rand < 0.82) {
    type = 'wildcard';
  } else {
    type = 'hint';
  }
  
  return { type, amount: Math.ceil(baseAmount * multiplier) };
};

export const getRankMultiplier = (rank: string): number => {
  if (rank === "Буквенный следопыт" || rank === "Словесный скаут") return 2;
  if (rank === "Адепт алфавита" || rank === "Мастер слов") return 3;
  if (rank === "Магистр букв") return 4;
  if (rank === "Живая энциклопедия") return 5;
  if (rank === "Оракул Словодела") return 10;
  return 1;
};