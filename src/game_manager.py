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
POLL_INTERVAL = 600 # Проверка каждые 10 минут

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

# --- РАССЫЛКА СООБЩЕНИЙ ---
def process_broadcasts():
    print("Проверка очереди рассылок...")
    try:
        # Получаем рассылки со статусом pending
        response = supabase.table("broadcasts").select("*").eq("status", "pending").execute()
        broadcasts = response.data
        
        if not broadcasts:
            print("Нет активных рассылок.")
            return

        # Получаем всех пользователей (с пагинацией, если их много)
        users = []
        start = 0
        step = 1000
        while True:
            u_res = supabase.table("leaderboard").select("telegram_id").range(start, start + step - 1).execute()
            if not u_res.data:
                break
            users.extend(u_res.data)
            if len(u_res.data) < step:
                break
            start += step
        
        print(f"Найдено {len(users)} пользователей для рассылки.")

        for broadcast in broadcasts:
            print(f"--- Рассылка ID {broadcast['id']} ---")
            msg_text = broadcast['message']
            sent_count = 0
            
            for user in users:
                tid = user.get('telegram_id')
                if not tid: continue
                
                try:
                    requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json={
                        "chat_id": tid,
                        "text": msg_text
                    }, timeout=5)
                    sent_count += 1
                    time.sleep(0.05) # Задержка 50мс
                except Exception as e:
                    print(f"Ошибка отправки {tid}: {e}")
            
            # Обновляем статус
            supabase.table("broadcasts").update({
                "status": "sent", 
                "sent_count": sent_count,
                "processed_at": datetime.now().isoformat()
            }).eq("id", broadcast['id']).execute()
            print(f"Рассылка завершена. Отправлено: {sent_count}")
            
    except Exception as e:
        print(f"Ошибка в process_broadcasts: {e}")

# --- ОТПРАВКА РЕЗУЛЬТАТОВ (В 03:00 UTC) ---
def process_results_notification():
    try:
        now_utc = datetime.now(timezone.utc)
        print(f"--- [RESULTS] Проверка времени: {now_utc.strftime('%H:%M:%S')} UTC ---")

        # Если время меньше 03:00 UTC, ничего не делаем
        if now_utc.hour < 3:
            print(f"Пропуск рассылки результатов: текущий час {now_utc.hour} < 3.")
            return

        # Получаем ID текущего активного испытания
        response = supabase.table("challenges").select("id").order("id", desc=True).limit(1).execute()
        if not response.data: 
            print("Нет активных испытаний в базе.")
            return
        
        current_active_id = response.data[0]['id']
        # Нас интересует предыдущее испытание, которое закончилось сегодня ночью
        target_id = current_active_id - 1
        
        if target_id < 1: 
            print(f"Целевой ID испытания некорректен ({target_id}).")
            return

        # Проверяем, была ли уже рассылка для этого ID (ищем системный флаг)
        flag_msg = f"[SYSTEM] Results sent for challenge {target_id}"
        check = supabase.table("broadcasts").select("id").eq("message", flag_msg).execute()
        if check.data:
            print(f"Рассылка для испытания №{target_id} уже была выполнена.")
            return # Рассылка уже была

        # Получаем дату испытания (end_time - 1 день)
        chal_data = supabase.table("challenges").select("end_time").eq("id", target_id).single().execute()
        challenge_date_str = "???"
        if chal_data.data:
            et_str = chal_data.data.get('end_time')
            if et_str:
                et = datetime.fromisoformat(et_str.replace('Z', '+00:00'))
                # Испытание заканчивается в 00:00 следующего дня, значит сама игра была в предыдущий день
                challenge_date_str = (et - timedelta(days=1)).strftime("%d.%m.%Y")

        print(f"[{now_utc.strftime('%H:%M:%S')}] Начинаем рассылку результатов за {challenge_date_str} (ID {target_id})...")

        # Получаем результаты
        scores_response = supabase.table("daily_scores").select("telegram_id, score").eq("challenge_id", target_id).order("score", desc=True).execute()
        scores = scores_response.data

        if scores:
            current_rank = 1
            for i, player in enumerate(scores):
                if i > 0 and player['score'] < scores[i-1]['score']:
                    current_rank += 1
                
                # Формируем сообщение
                msg = f"🏁 Итоги Дневного испытания ({challenge_date_str})\n\nВы заняли {current_rank}-е место с результатом {player['score']} очков!"
                
                # Добавляем про награду только победителям
                if current_rank <= 3:
                    msg += "\n\n🎉ПОЗДРАВЛЯЕМ!\n🎁Награда уже начислена!\n\n👏Ждем вас в новом испытании!"
                else:
                    msg += "\n\n💥Попробуйте свои силы сегодня!\n👏Ждем вас в новом испытании!"

                try:
                    requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json={
                        "chat_id": player['telegram_id'],
                        "text": msg
                    }, timeout=5)
                    time.sleep(0.1)
                except Exception as e:
                    print(f"Ошибка отправки: {e}")

        # Ставим флаг, что рассылка выполнена
        supabase.table("broadcasts").insert({"message": flag_msg, "status": "sent"}).execute()
        print(f"Рассылка результатов №{target_id} завершена.")

    except Exception as e:
        print(f"Ошибка в process_results_notification: {e}")

# --- ЕЖЕДНЕВНОЕ ОБНОВЛЕНИЕ ---
def process_daily_update():
    try:
        now_utc = datetime.now(timezone.utc)
        print(f"--- [DAILY UPDATE] Проверка времени: {now_utc.strftime('%H:%M:%S')} UTC ---")
        
        # 1. Проверяем, пора ли обновлять испытание
        response = supabase.table("challenges").select("*").order("id", desc=True).limit(1).execute()
        
        if response.data:
            last_challenge = response.data[0]
            end_time_str = last_challenge.get('end_time')
            if end_time_str:
                end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                # Если время еще не пришло, выходим
                if now_utc < end_time:
                    print(f"Рано обновлять испытание. Текущее время: {now_utc}, Дедлайн: {end_time}")
                    return

        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] --- НАЧАЛО ЕЖЕДНЕВНОГО ОБНОВЛЕНИЯ ---")

        # Получаем ID текущего (завершаемого) испытания
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
                        update_data = {
                            "bonus_time": (u.get('bonus_time', 0) or 0) + bonus_amount,
                            "bonus_hint": (u.get('bonus_hint', 0) or 0) + bonus_amount,
                            "bonus_swap": (u.get('bonus_swap', 0) or 0) + bonus_amount,
                            "bonus_wildcard": (u.get('bonus_wildcard', 0) or 0) + bonus_amount
                        }
                        if rank == 1: update_data["daily_1_place"] = (u.get('daily_1_place', 0) or 0) + 1
                        elif rank == 2: update_data["daily_2_place"] = (u.get('daily_2_place', 0) or 0) + 1
                        elif rank == 3: update_data["daily_3_place"] = (u.get('daily_3_place', 0) or 0) + 1
                        
                        supabase.table("leaderboard").update(update_data).eq("telegram_id", player['telegram_id']).execute()

                        # Создаем уведомление для фронтенда, чтобы показать окно награды
                        try:
                            # Дата игры (вчерашняя)
                            game_date = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%d.%m.%Y")
                            notif_payload = {
                                "rank": rank,
                                "score": player['score'],
                                "bonus_amount": bonus_amount,
                                "date": game_date
                            }
                            supabase.table("notifications").insert({
                                "telegram_id": player['telegram_id'],
                                "type": "daily_win",
                                "data": notif_payload
                            }).execute()
                        except Exception as ne:
                            print(f"Ошибка создания уведомления: {ne}")
        
        # 4. Генерируем и создаем НОВОЕ испытание
        new_letters = {
            "10": generate_grid(10),
            "8": generate_grid(8),
            "6": generate_grid(6)
        }
        
        # Рассчитываем время окончания (00:00 UTC - Полночь)
        now_utc = datetime.now(timezone.utc)
        next_deadline = now_utc.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        end_time = next_deadline.isoformat()

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
        print(f"Бот-менеджер запущен в режиме цикла. Интервал опроса: {POLL_INTERVAL} сек.")
        while True:
            process_broadcasts()
            process_daily_update()
            time.sleep(POLL_INTERVAL)
    else:
        # Иначе запускаем один раз (для GitHub Actions)
        print("Запуск разовой проверки...")
        process_broadcasts()
        process_results_notification()
        # В разовом режиме принудительно не запускаем, если время не пришло (логика внутри функции)
        process_daily_update()