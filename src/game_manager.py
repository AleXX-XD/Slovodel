import os
import sys
import time
import random
import requests
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client

# --- КОНФИГУРАЦИЯ ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://viyqhdvziizfvokmkrgb.supabase.co")
# Ключи берем из переменных окружения (Environment Variables)
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Время одного раунда в секундах (24 часа = 86400)
UPDATE_INTERVAL = 24 * 60 * 60 

# Инициализация клиента Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- ГЕНЕРАЦИЯ БУКВ ---
VOWELS_UNIQUE = "АЕИОУЮЯ"
COMMON_CONSONANTS = "БВГДЗКЛМНПРСТ"
RARE_LIST = "ЙЦФЧХШЩЬЫЖЭ"

def generate_grid(level):
    letters = []
    
    # 1. Гласные
    target_vowels = 4 if level == 10 else 3 if level == 8 else 2
    vowels_pool = list(VOWELS_UNIQUE)
    random.shuffle(vowels_pool)
    letters.extend(vowels_pool[:target_vowels])
    
    # 2. Согласные (с шансом на редкие)
    # Определяем заранее, будет ли редкая буква (30% шанс на весь уровень)
    allow_rare = random.random() < 0.3
    
    cons_pool = list(COMMON_CONSONANTS + RARE_LIST)
    random.shuffle(cons_pool)
    
    rare_count = 0
    for c in cons_pool:
        if len(letters) >= level:
            break
        
        if c in RARE_LIST:
            # Добавляем редкую, только если разрешено и еще нет ни одной
            if allow_rare and rare_count < 1:
                letters.append(c)
                rare_count += 1
        else:
            letters.append(c)
            
    # Добиваем обычными согласными, если не хватило
    if len(letters) < level:
        backup = list(COMMON_CONSONANTS)
        random.shuffle(backup)
        letters.extend(backup[:level - len(letters)])
        
    random.shuffle(letters)
    return letters

# --- ОСНОВНАЯ ЛОГИКА ---
def run_game_cycle():
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] --- НАЧАЛО ОБНОВЛЕНИЯ ---")
    
    try:
        # 1. Получаем ID текущего испытания из таблицы challenges
        response = supabase.table("challenges").select("id").order("id", desc=True).limit(1).execute()
        current_id = str(response.data[0]['id']) if response.data and len(response.data) > 0 else None
        
        scores = []
        if current_id:
            print(f"Завершаем испытание №{current_id}")

            # 2. Получаем результаты игроков и сортируем
            scores_response = supabase.table("daily_scores")\
                .select("telegram_id, score, username")\
                .eq("challenge_id", current_id)\
                .order("score", desc=True)\
                .execute()
                
            scores = scores_response.data
            print(f"Найдено участников: {len(scores)}")
        
        # 3. Раздаем награды и уведомления
        if scores:
            current_rank = 1
            for i, player in enumerate(scores):
                # Обработка одинаковых мест при равенстве очков
                if i > 0 and player['score'] < scores[i-1]['score']:
                    current_rank += 1
                
                rank = current_rank
                reward_text = ""
                bonus_amount = 0
                
                # Определение награды
                if rank == 1: bonus_amount = 3
                elif rank == 2: bonus_amount = 2
                elif rank == 3: bonus_amount = 1
                
                if bonus_amount > 0:
                    # Начисляем бонусы в таблицу leaderboard
                    user_data = supabase.table("leaderboard").select("*").eq("telegram_id", player['telegram_id']).single().execute()
                    if user_data.data:
                        u = user_data.data
                        supabase.table("leaderboard").update({
                            "bonus_time": (u.get('bonus_time', 0) or 0) + bonus_amount,
                            "bonus_hint": (u.get('bonus_hint', 0) or 0) + bonus_amount,
                            "bonus_swap": (u.get('bonus_swap', 0) or 0) + bonus_amount,
                            "bonus_wildcard": (u.get('bonus_wildcard', 0) or 0) + bonus_amount
                        }).eq("telegram_id", player['telegram_id']).execute()
                        reward_text = f"\n\n🎁 ВАША НАГРАДА:\nПо {bonus_amount} шт. каждой подсказки!"

                # Текст сообщения
                msg = f"🏁 Итоги Испытания №{current_id}\n\n"
                msg += f"Вы заняли {rank}-е место с результатом {player['score']} очков!"
                if rank <= 3:
                    msg += f"\n🎉 ПОЗДРАВЛЯЕМ! Вы вошли в тройку лидеров!{reward_text}"
                else:
                    msg += f"\nСпасибо за участие! Новое испытание уже началось!"
                
                # Отправка в Telegram (ТОЛЬКО ПОБЕДИТЕЛЯМ, чтобы не перегружать скрипт)
                if rank <= 3:
                    try:
                        requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json={
                            "chat_id": player['telegram_id'],
                            "text": msg
                        }, timeout=5) # Добавлен таймаут 5 секунд
                    except Exception as e:
                        print(f"Ошибка отправки сообщения игроку {player['telegram_id']}: {e}")
        
        # 4. Генерируем и создаем НОВОЕ испытание
        new_letters = {
            "10": generate_grid(10),
            "8": generate_grid(8),
            "6": generate_grid(6)
        }
        
        # Рассчитываем время окончания (следующая полночь по UTC)
        # Это синхронизирует таймер в игре с расписанием GitHub Actions (00:00 UTC)
        now_utc = datetime.now(timezone.utc)
        next_midnight = now_utc.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        end_time = next_midnight.isoformat()

        # Вставляем в таблицу challenges (ID создастся автоматически)
        new_challenge = supabase.table("challenges").insert({
            "letters": new_letters,
            "end_time": end_time
        }).execute()
        
        # Получаем ID созданного испытания
        next_id = str(new_challenge.data[0]['id'])
        
        print(f"✅ УСПЕХ! Новое испытание №{next_id} создано.")
        print(f"Следующее обновление через {UPDATE_INTERVAL/60} минут.")

    except Exception as e:
        print(f"❌ КРИТИЧЕСКАЯ ОШИБКА: {e}")

# --- ЗАПУСК ---
if __name__ == "__main__":
    if not SUPABASE_KEY or not BOT_TOKEN:
        print("❌ ОШИБКА: Не найдены переменные окружения SUPABASE_KEY или BOT_TOKEN")
        sys.exit(1)

    # Если передан аргумент "loop", запускаем вечный цикл (для локального теста)
    if len(sys.argv) > 1 and sys.argv[1] == "loop":
        print(f"Бот-менеджер запущен в режиме цикла. Интервал: {UPDATE_INTERVAL} сек.")
        while True:
            run_game_cycle()
            time.sleep(UPDATE_INTERVAL)
    else:
        # Иначе запускаем один раз (для GitHub Actions)
        print("Запуск разового обновления...")
        run_game_cycle()