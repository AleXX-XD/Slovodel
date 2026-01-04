import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Ваша игра
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Инициализация Supabase
const SUPABASE_URL = 'https://viyqhdvziizfvokmkrgb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8a3YVhILjtosfMP_qQ4ynQ_SeWM506c';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tg = window.Telegram.WebApp;

// Функция для сохранения (передаем в App)
const saveGlobalScore = async (score) => {
  const user = tg.initDataUnsafe?.user;
  const userId = user?.id || 'pc-user-' + Math.floor(Math.random() * 1000);
  const userName = user?.first_name || 'Игрок ПК';

  try {
    await supabase.from('leaderboard').upsert({ 
      id: userId, 
      name: userName, 
      score: score,
      updated_at: new Date() 
    }, { onConflict: 'id' });
  } catch (e) {
    console.error("Ошибка сохранения:", e);
  }
};

// Функция для загрузки (передаем в App)
const fetchLeaderboard = async () => {
  const { data } = await supabase
    .from('leaderboard')
    .select('name, score')
    .order('score', { ascending: false })
    .limit(10);
  return data || [];
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Передаем функции как пропсы */}
    <App 
      saveScore={saveGlobalScore} 
      getLeaderboard={fetchLeaderboard} 
      tg={tg}
    />
  </React.StrictMode>
);