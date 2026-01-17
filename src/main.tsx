import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; 
// Используем установленный пакет вместо URL
import { createClient } from '@supabase/supabase-js';
import { getDailyDateString } from './utils/gameUtils';

// Инициализация Supabase
// Используем переменные окружения для безопасности
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Добавляем проверку на существование Telegram, чтобы не падало на ПК
const tg = window.Telegram?.WebApp;

// Функция для сохранения данных пользователя (очки + бонусы)
const saveUserData = async (data: {
  telegramId?: number;
  username: string;
  score: number;
  bonuses: { time: number; hint: number; swap: number; wildcard: number };
  avatarUrl?: string;
  rareWords: any[];
  totalWords: number;
  highScore: number;
  daysPlayed: number;
  streak: number;
}) => {
  if (!data.telegramId) {
    console.warn("Нет Telegram ID, данные не будут сохранены в облако.");
    return;
  }

  const { error } = await supabase
    .from('leaderboard') // Убедитесь, что таблица в Supabase называется именно так
    .upsert({ 
      telegram_id: data.telegramId,
      username: data.username,
      avatar_url: data.avatarUrl,
      score: data.score,
      bonus_time: data.bonuses.time,
      bonus_hint: data.bonuses.hint,
      bonus_swap: data.bonuses.swap,
      bonus_wildcard: data.bonuses.wildcard,
      rare_words: data.rareWords,
      total_words: data.totalWords,
      high_score: data.highScore,
      days_played: data.daysPlayed,
      streak: data.streak,
      updated_at: new Date() 
    }, { onConflict: 'telegram_id' });

  if (error) console.error('Ошибка Supabase:', error.message);
};

// Функция для сохранения результата ежедневного испытания
const saveDailyScore = async (data: {
  telegramId: number;
  username: string;
  avatarUrl?: string;
  score: number;
  bonuses?: { time: number; hint: number; swap: number; wildcard: number };
  challengeId: string;
  levelScores?: Record<number, number>;
}) => {
  const challengeIdInt = parseInt(data.challengeId) || 0;
  
  // 1. Проверяем, есть ли уже запись для этого игрока в этом испытании
  const { data: existingEntry } = await supabase
    .from('daily_scores')
    .select('telegram_id')
    .eq('telegram_id', data.telegramId)
    .eq('challenge_id', challengeIdInt)
    .single();

  const payload = {
    telegram_id: data.telegramId,
    username: data.username,
    avatar_url: data.avatarUrl,
    score: data.score,
    challenge_id: challengeIdInt,
    game_date: getDailyDateString(),
    bonus_time: data.bonuses?.time,
    bonus_hint: data.bonuses?.hint,
    bonus_swap: data.bonuses?.swap,
    bonus_wildcard: data.bonuses?.wildcard,
    level_scores: data.levelScores
  };

  let error;

  if (existingEntry) {
    // Если запись есть — обновляем (ID не тратится)
    ({ error } = await supabase
      .from('daily_scores')
      .update(payload)
      .eq('telegram_id', data.telegramId)
      .eq('challenge_id', challengeIdInt));
  } else {
    // Если записи нет — создаем новую (ID увеличивается на 1)
    ({ error } = await supabase
      .from('daily_scores')
      .insert(payload));
  }

  if (error) console.error('Ошибка сохранения ежедневного счета:', error.message);
};

// Функция для проверки, играл ли пользователь сегодня
const getUserDailyScore = async (telegramId: number, challengeId: string) => {
  try {
    const { data, error } = await supabase
      .from('daily_scores')
      .select('*')
      .eq('telegram_id', telegramId)
      .eq('challenge_id', challengeId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (e) {
    console.error("Ошибка проверки ежедневной игры:", e);
    return null;
  }
};

// Функция для загрузки профиля пользователя
const fetchUserData = async (telegramId: number) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Игрок не найден (это нормально для новичка)
      throw error; // Другая ошибка (сеть и т.д.) - пробрасываем её!
    }
    return data;
  } catch (e) {
    console.error("Ошибка загрузки профиля:", e);
    throw e; // Пробрасываем ошибку дальше, чтобы App.tsx не подумал, что это новый игрок
  }
};

// Функция для загрузки
const fetchLeaderboard = async () => {
  try {
    const { data, error, count } = await supabase
      .from('leaderboard')
      .select('name:username, score, avatar_url, telegram_id', { count: 'exact' })
      .order('score', { ascending: false })
      .limit(5);  //ТОП ИГРОКОВ
    
    if (error) throw error;
    return { players: data || [], count: count || 0 };
  } catch (e) {
    console.error("Ошибка загрузки рейтинга:", e);
    return { players: [], count: 0 };
  }
};

// Функция для загрузки ежедневного рейтинга
const fetchDailyLeaderboard = async (challengeId: string) => {
  try {
    const { data, error, count } = await supabase
      .from('daily_scores')
      .select('name:username, score, avatar_url, telegram_id', { count: 'exact' })
      .eq('challenge_id', challengeId)
      .order('score', { ascending: false })
      .limit(5); //ТОП ИГРОКОВ
    
    if (error) throw error;
    return { players: data || [], count: count || 0 };
  } catch (e) {
    console.error("Ошибка загрузки ежедневного рейтинга:", e);
    return { players: [], count: 0 };
  }
};

// Функция для загрузки рейтинга за прошлый день
const fetchPreviousDailyLeaderboard = async (currentChallengeId: string) => {
  try {
    const prevId = (parseInt(currentChallengeId) - 1).toString();
    
    const { data, error, count } = await supabase
      .from('daily_scores')
      .select('name:username, score, avatar_url, telegram_id', { count: 'exact' })
      .eq('challenge_id', prevId)
      .order('score', { ascending: false })
      .limit(5); 
    
    if (error) throw error;
    return { players: data || [], count: count || 0 };
  } catch (e) {
    console.error("Ошибка загрузки рейтинга за вчера:", e);
    return { players: [], count: 0 };
  }
};

// Функция для сохранения отзыва
const saveFeedback = async (data: {
  telegramId?: number;
  username: string;
  message: string;
}) => {
  const { error } = await supabase
    .from('feedback')
    .insert({ 
      telegram_id: data.telegramId, 
      username: data.username, 
      message: data.message 
    });

  if (error) console.error('Ошибка отправки отзыва:', error.message);
};

// Функция для получения отзывов (для админа)
const fetchFeedbacks = async () => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) console.error('Ошибка загрузки отзывов:', error.message);
  return data || [];
};

// Функция для добавления слова в словарь
const addCustomWord = async (word: string, telegramId: number) => {
  const { error } = await supabase
    .from('custom_words')
    .insert({ word: word.toLowerCase(), added_by: telegramId });
  
  if (error) {
    console.error('Ошибка добавления слова:', error.message);
    return false;
  }
  return true;
};

// Функция для получения кастомных слов
const fetchCustomWords = async () => {
  const { data, error } = await supabase
    .from('custom_words')
    .select('word');
  
  if (error) console.error('Ошибка загрузки слов:', error.message);
  return data?.map(item => item.word) || [];
};

// Функция для получения слов для админки (с ID)
const fetchAdminCustomWords = async () => {
  const { data, error } = await supabase
    .from('custom_words')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) console.error('Ошибка загрузки слов админки:', error.message);
  return data || [];
};

// Функция для удаления слова
const deleteCustomWord = async (id: number) => {
  const { error } = await supabase
    .from('custom_words')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Ошибка удаления слова:', error.message);
    return false;
  }
  return true;
};

// Функция для обновления слова
const updateCustomWord = async (id: number, newWord: string) => {
  const { error } = await supabase
    .from('custom_words')
    .update({ word: newWord.toLowerCase() })
    .eq('id', id);
  
  if (error) {
    console.error('Ошибка обновления слова:', error.message);
    return false;
  }
  return true;
};

// Функция для ответа на отзыв
const sendFeedbackReply = async (feedbackId: number, message: string) => {
  // 1. Обновляем статус в БД
  const { error: dbError } = await supabase
    .from('feedback')
    .update({ status: 'replied', admin_reply: message })
    .eq('id', feedbackId);

  if (dbError) {
    console.error('Ошибка обновления отзыва:', dbError.message);
    return false;
  }

  // Отправка через Supabase отключена. Бэкенд на Python должен отслеживать новые ответы в БД.
  console.log('Ответ сохранен в БД. Отправка сообщения через Supabase отключена.');

  return true;
};

// Функция для архивации отзыва
const archiveFeedback = async (id: number) => {
  const { error } = await supabase
    .from('feedback')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    console.error('Ошибка архивации:', error.message);
    return false;
  }
  return true;
};

// Функция для удаления отзыва
const deleteFeedback = async (id: number) => {
  const { error } = await supabase
    .from('feedback')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Ошибка удаления:', error.message);
    return false;
  }
  return true;
};

const getActiveChallenge = async () => {
  // Берем последнее созданное испытание (сортировка по убыванию ID)
  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, letters, end_time')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (challenge) {
    return { id: challenge.id.toString(), letters: challenge.letters, endTime: challenge.end_time };
  }

  return { id: '1', letters: null, endTime: null };
};

const fetchUserRank = async (telegramId: number) => {
  try {
    const { data, error } = await supabase
      .rpc('get_player_rank', { p_telegram_id: telegramId });
    
    if (error) throw error;

    if (typeof data === 'number') return { rank: data };
    if (Array.isArray(data) && data.length > 0) return data[0];

    return null;
  } catch (e) {
    console.error("Ошибка загрузки ранга игрока:", e);
    return null;
  }
};

// Исправляем потенциальную ошибку с null для root
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App 
        saveUserData={saveUserData} 
        saveDailyScore={saveDailyScore}
        getUserData={fetchUserData}
        getActiveChallenge={getActiveChallenge}
        fetchUserRank={fetchUserRank}
        getLeaderboard={fetchLeaderboard} 
        getDailyLeaderboard={fetchDailyLeaderboard}
        fetchPreviousDailyLeaderboard={fetchPreviousDailyLeaderboard}
        getUserDailyScore={getUserDailyScore}
        saveFeedback={saveFeedback}
        fetchFeedbacks={fetchFeedbacks}
        addCustomWord={addCustomWord}
        fetchCustomWords={fetchCustomWords}
        fetchAdminCustomWords={fetchAdminCustomWords}
        deleteCustomWord={deleteCustomWord}
        updateCustomWord={updateCustomWord}
        sendFeedbackReply={sendFeedbackReply}
        archiveFeedback={archiveFeedback}
        deleteFeedback={deleteFeedback}
        tg={tg}
      />
    </React.StrictMode>
  );
}