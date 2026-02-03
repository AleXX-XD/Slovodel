// Получаем данные для авторизации
const getAuthData = () => {
  // 1. Пытаемся взять initData (если мы внутри Telegram Mini App)
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) return initData;

  // 2. Пытаемся взять JWT токен (если мы в браузере)
  const token = localStorage.getItem('slovodel_token');
  if (token) return `Bearer ${token}`;

  return '';
};

// Определяем базовый URL в зависимости от режима
const BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:5000/api' : '/api';

export const apiClient = {
  baseUrl: BASE_URL,

  async request(endpoint: string, options: RequestInit = {}) {
    const authData = getAuthData();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authData,
      ...options.headers,
    } as HeadersInit;

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
      
      // Обработка 400 Bad Request (например, слово уже есть)
      if (res.status === 400) {
          return await res.json();
      }

      if (!res.ok) {
         if (res.status === 404) return null;
         if (res.status === 401 || res.status === 403) {
             // localStorage.removeItem('slovodel_token');
         }
         throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (e) {
      console.error(`Fetch error for ${endpoint}:`, e);
      throw e;
    }
  },

  // Метод для входа через виджет
  async login(telegramData: any) {
    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramData)
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('slovodel_token', data.token);
        return data;
      }
      throw new Error(data.error || 'Login failed');
    } catch (e) {
      console.error("Login error:", e);
      throw e;
    }
  },

  async getUser(telegramId: number) {
    return await this.request(`/user/${telegramId}`);
  },
  
  async getMyProfile() {
      return await this.request('/user/me');
  },

  async saveUser(data: any) {
    return await this.request('/user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async getUserRank(telegramId?: number) {
    if (telegramId) {
        return await this.request(`/rank/${telegramId}`);
    }
    return await this.request(`/rank`);
  },

  async getLeaderboard() {
    return await this.request('/leaderboard');
  },

  async getActiveChallenge() {
    return await this.request('/challenge/active');
  },

  async saveDailyScore(data: any) {
    return await this.request('/daily/score', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async claimReward(rewardId: string, multiplier: number) {
    return await this.request('/rewards/claim', {
      method: 'POST',
      body: JSON.stringify({ rewardId, multiplier })
    });
  },

  async checkDailyScore(challengeId: string) {
     return await this.request(`/daily/check?challengeId=${challengeId}`);
  },

  async getDailyScore(_telegramId: number, challengeId: string) {
    return await this.request(`/daily/check?challengeId=${challengeId}`);
  },

  async getDailyLeaderboard(challengeId: string) {
    return await this.request(`/daily/leaderboard?challengeId=${challengeId}`);
  },

  async saveFeedback(data: any) {
    return await this.request('/feedback', {
        method: 'POST',
        body: JSON.stringify(data)
    });
  },
  
  async getFeedbacks() {
      return await this.request('/feedback/list');
  },

  async archiveFeedback(id: number) {
      return await this.request('/feedback/archive', {
          method: 'POST',
          body: JSON.stringify({ id })
      });
  },

  async deleteFeedback(id: number) {
      return await this.request('/feedback/delete', {
          method: 'POST',
          body: JSON.stringify({ id })
      });
  },

  async replyFeedback(id: number, text: string) {
      return await this.request('/feedback/reply', {
          method: 'POST',
          body: JSON.stringify({ id, text })
      });
  },

  async sendBroadcast(message: string) {
      return await this.request('/broadcast', {
          method: 'POST',
          body: JSON.stringify({ message })
      });
  },
  
  async getNotifications() {
    return await this.request(`/notifications`);
  },

  async deleteNotification(id: number) {
    return await this.request(`/notifications/${id}`, { method: 'DELETE' });
  },
  
  async createInvoice(packId: number) {
      return await this.request('/payment/create-invoice', {
          method: 'POST',
          body: JSON.stringify({ packId })
      });
  },

  async verifyPayment() {
      return await this.request('/payment/verify', {
          method: 'POST'
      });
  },

  async addWord(word: string, definition?: string) {
      return await this.request('/words/add', {
          method: 'POST',
          body: JSON.stringify({ word, definition })
      });
  },
  
  async searchWord(word: string) {
      // Ищем конкретное слово
      return await this.request(`/words/search?q=${encodeURIComponent(word)}`);
  },

  async updateWord(word: string, definition: string) {
      return await this.request('/words/update', {
          method: 'POST',
          body: JSON.stringify({ word, definition })
      });
  },
  
  // Больше не используем загрузку всего списка
  async getWords() {
      return []; 
  },
  
  async deleteWord(idOrWord: number | string) {
      const body = typeof idOrWord === 'string' ? { word: idOrWord } : { id: idOrWord };
      return await this.request('/words/delete', {
          method: 'POST',
          body: JSON.stringify(body)
      });
  }
};