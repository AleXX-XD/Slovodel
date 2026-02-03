import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; 
import { apiClient } from './utils/apiClient'; // <-- ИЗМЕНЕНО: Новый клиент

const tg = window.Telegram?.WebApp;

// --- ФУНКЦИИ-ОБЕРТКИ ВОКРУГ НОВОГО API ---

const saveUserData = async (data: any) => {
  if (!data.telegramId) return;
  await apiClient.saveUser(data);
};

const saveDailyScore = async (data: any) => {
  // Адаптируем формат данных под API, если нужно
  await apiClient.saveDailyScore({
    telegramId: data.telegramId,
    username: data.username,
    avatarUrl: data.avatarUrl,
    score: data.score,
    challengeId: data.challengeId,
    levelScores: data.levelScores,
    bonus_time: data.bonuses?.time,
    bonus_hint: data.bonuses?.hint,
    bonus_swap: data.bonuses?.swap,
    bonus_wildcard: data.bonuses?.wildcard,
  });
};

const getUserDailyScore = async (_telegramId: number, challengeId: string) => {
  return await apiClient.getDailyScore(_telegramId, challengeId);
};

const fetchUserData = async (_telegramId: number) => {
  // Игнорируем переданный ID, так как клиент теперь сам знает, кого грузить
  return await apiClient.getUser(_telegramId);
};

const fetchLeaderboard = async () => {
  return await apiClient.getLeaderboard();
};

const fetchDailyLeaderboard = async (challengeId: string) => {
  return await apiClient.getDailyLeaderboard(challengeId);
};

const fetchPreviousDailyLeaderboard = async (currentChallengeId: string) => {
  const prevId = (parseInt(currentChallengeId) - 1).toString();
  return await apiClient.getDailyLeaderboard(prevId);
};

const saveFeedback = async (data: any) => {
  await apiClient.saveFeedback(data);
};

const fetchNotifications = async (_telegramId: number) => {
  return await apiClient.getNotifications();
};

const deleteNotification = async (id: number) => {
  await apiClient.deleteNotification(id);
};

const getActiveChallenge = async () => {
  return await apiClient.getActiveChallenge();
};

const fetchUserRank = async (telegramId: number) => {
  return await apiClient.getUserRank(telegramId);
};

// Админские функции
const addCustomWord = async (word: string) => await apiClient.addWord(word);
const deleteCustomWord = async (idOrWord: number | string) => (await apiClient.deleteWord(idOrWord)).success;
const updateCustomWord = async (word: string, definition: string) => (await apiClient.updateWord(word, definition)).success;
const onSearchWord = async (word: string) => await apiClient.searchWord(word);
const fetchFeedbacks = async () => await apiClient.getFeedbacks(); // Подключаем реальный API

// Заглушки (пока не реализованы в новом API или не используются)
const fetchAdminCustomWords = async () => []; 
const fetchCustomWords = async () => [];
const sendFeedbackReply = async (feedbackId: number, _telegramId: number, text: string) => (await apiClient.replyFeedback(feedbackId, text)).success;
const archiveFeedback = async (id: number) => (await apiClient.archiveFeedback(id)).success;
const deleteFeedback = async (id: number) => (await apiClient.deleteFeedback(id)).success;
const sendBroadcast = async (message: string) => (await apiClient.sendBroadcast(message)).success;


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
        onSearchWord={onSearchWord}
        sendFeedbackReply={sendFeedbackReply}
        archiveFeedback={archiveFeedback}
        deleteFeedback={deleteFeedback}
        sendBroadcast={sendBroadcast}
        fetchNotifications={fetchNotifications}
        deleteNotification={deleteNotification}
        tg={tg}
      />
    </React.StrictMode>
  );
}
