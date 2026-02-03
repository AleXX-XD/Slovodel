import { RARE_LIST, VOWELS_UNIQUE, COMMON_CONSONANTS, RANKS } from './constants';

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

export const getLevelData = (score: number) => {
  if (score < 1000) return { level: 0, min: 0, next: 1000 };
  if (score < 2500) return { level: 1, min: 1000, next: 2500 };
  if (score < 5000) return { level: 2, min: 2500, next: 5000 };
  if (score < 10000) return { level: 3, min: 5000, next: 10000 };
  if (score < 20000) return { level: 4, min: 10000, next: 20000 };
  if (score < 50000) return { level: 5, min: 20000, next: 50000 };
  if (score < 100000) return { level: 6, min: 50000, next: 100000 };
  if (score < 200000) return { level: 7, min: 100000, next: 200000 };
  if (score < 500000) return { level: 8, min: 200000, next: 500000 };
  if (score < 1000000) return { level: 9, min: 500000, next: 1000000 };

  // Уровень 10 и выше (каждые 500к)
  const base = 1000000;
  const step = 500000;
  const extra = score - base;
  const extraLevels = Math.floor(extra / step);
  const currentLevelStart = base + (extraLevels * step);
  
  return {
    level: 10 + extraLevels,
    min: currentLevelStart,
    next: currentLevelStart + step
  };
};

export const getUserRank = (points: number) => {
  const { level } = getLevelData(points);
  return `${level} уровень`;
};

export const getRankMeta = (level: number) => {
  return [...RANKS].reverse().find(r => level >= r.minLevel) || RANKS[0];
};

export const formatTime = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getLevelProgress = (points: number) => {
  const { min, next } = getLevelData(points);
  const progress = ((points - min) / (next - min)) * 100;
  return Math.max(0, Math.min(100, progress));
};

export const getNextLevelTarget = (points: number) => {
  const { next } = getLevelData(points);
  return next;
};

export const generateGrid = (level: number, seed?: number, forceRare: boolean = false) => {
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

  // Если forceRare, то обязательно добавляем одну редкую букву
  if (forceRare) {
      const rarePool = RARE_LIST.split('').sort(() => (seed !== undefined ? rand() - 0.5 : Math.random() - 0.5));
      letters.add(rarePool[0]);
      rareCount++;
  }

  const rareChance = rand() < 0.3;

  // 2. Набор согласных
  const consPool = (COMMON_CONSONANTS + RARE_LIST).split('').sort(() => (seed !== undefined ? rand() - 0.5 : Math.random() - 0.5));

  for (const c of consPool) {
    if (letters.size >= level) break;

    // Если буква уже есть (например, редкая добавлена выше), пропускаем
    if (letters.has(c)) continue;

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

export const generateRandomReward = (multiplierOrRank: number | string = 1): { type: 'time' | 'hint' | 'swap' | 'wildcard', amount: number } => {
  let multiplier = 1;
  if (typeof multiplierOrRank === 'number') {
    multiplier = multiplierOrRank;
  } else {
    multiplier = getRankMultiplier(multiplierOrRank);
  }

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
  if (rank === "Адепт алфавита") return 2;
  if (rank === "Магистр букв") return 3;
  if (rank === "Оракул Словодела") return 4;
  return 1;
};

export const getMarathonSwapIndex = (gridLength: number, forbiddenIndices: number[]) => {
  const available = [];
  for (let i = 0; i < gridLength; i++) {
    if (!forbiddenIndices.includes(i)) available.push(i);
  }
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

export const replaceLetterAtIndex = (currentGrid: string[], indexToReplace: number) => {
  const newGrid = [...currentGrid];
  const oldChar = newGrid[indexToReplace];
  
  const isVowel = VOWELS_UNIQUE.includes(oldChar);
  const isRare = RARE_LIST.includes(oldChar);
  
  let newChar = '';
  let attempts = 0;
  
  // Пытаемся найти уникальную букву того же типа, отличную от старой
  while (attempts < 50) {
      const rand = Math.random();
      if (isVowel) {
          const pool = VOWELS_UNIQUE.split('');
          newChar = pool[Math.floor(rand * pool.length)];
      } else if (isRare) {
          const pool = RARE_LIST.split('');
          newChar = pool[Math.floor(rand * pool.length)];
      } else {
          // Обычная согласная
          const pool = COMMON_CONSONANTS.split('');
          newChar = pool[Math.floor(rand * pool.length)];
      }
      
      // Проверка: буквы не должно быть в текущей сетке И она не должна быть равна старой
      if (!currentGrid.includes(newChar) && newChar !== oldChar) {
          break;
      }
      attempts++;
  }
  
  // Если не нашли уникальную за 50 попыток (маловероятно), меняем на любую допустимую того же типа, кроме старой
  if (attempts >= 50) {
      // Резервная попытка просто сменить букву, игнорируя уникальность в сетке, но соблюдая тип и отличие от старой
      let pool = '';
      if (isVowel) pool = VOWELS_UNIQUE;
      else if (isRare) pool = RARE_LIST;
      else pool = COMMON_CONSONANTS;
      
      const filteredPool = pool.split('').filter(c => c !== oldChar);
      if (filteredPool.length > 0) {
          newChar = filteredPool[Math.floor(Math.random() * filteredPool.length)];
      } else {
          // Если вдруг в пуле всего 1 буква (невозможно для текущих констант), оставляем старую
          newChar = oldChar;
      }
  }

  newGrid[indexToReplace] = newChar;
  return newGrid;
};

export const generateMarathonGrid = (seed?: number) => {
  // Для марафона всегда 10 букв и гарантированно 1 редкая буква
  return generateGrid(10, seed, true);
};