import os
import time
import random
import requests
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, Column, Integer, BigInteger, Text, DateTime, func
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.dialects.postgresql import JSONB

# --- КОНФИГУРАЦИЯ ---
def get_db_url():
    user = os.environ.get('POSTGRES_USER')
    pw = os.environ.get('POSTGRES_PASSWORD')
    db_name = os.environ.get('POSTGRES_DB')
    
    # Если запущен внутри Docker (сервис api), хост базы - 'db' (передается через ENV)
    # Если запущен просто в консоли сервера - 'localhost'
    host = os.environ.get('POSTGRES_HOST', 'localhost')
    
    if all([user, pw, db_name]):
        return f"postgresql+psycopg2://{user}:{pw}@{host}:5432/{db_name}"
    
    # Фолбэк на старую переменную или sqlite
    return os.environ.get('DATABASE_URL', 'sqlite:///slovodel.db').replace("postgresql://", "postgresql+psycopg2://", 1)

DATABASE_URL = get_db_url()
BOT_TOKEN = os.environ.get('BOT_TOKEN')

Base = declarative_base()

# --- МОДЕЛИ ---
class Leaderboard(Base):
    __tablename__ = 'leaderboard'
    telegram_id = Column(BigInteger, primary_key=True)
    username = Column(Text)
    bonus_time = Column(Integer, default=3)
    bonus_hint = Column(Integer, default=3)
    bonus_swap = Column(Integer, default=3)
    bonus_wildcard = Column(Integer, default=3)
    daily_1_place = Column(Integer, default=0)
    daily_2_place = Column(Integer, default=0)
    daily_3_place = Column(Integer, default=0)

class DailyScore(Base):
    __tablename__ = 'daily_scores'
    id = Column(BigInteger, primary_key=True)
    telegram_id = Column(BigInteger)
    challenge_id = Column(BigInteger)
    score = Column(Integer)
    username = Column(Text)

class Challenge(Base):
    __tablename__ = 'challenges'
    id = Column(BigInteger, primary_key=True)
    letters = Column(JSONB)
    end_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(BigInteger, primary_key=True)
    telegram_id = Column(BigInteger)
    type = Column(Text)
    data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Broadcast(Base):
    __tablename__ = 'broadcasts'
    id = Column(BigInteger, primary_key=True)
    message = Column(Text)
    status = Column(Text, default='pending')
    sent_count = Column(BigInteger, default=0)
    processed_at = Column(DateTime(timezone=True))

# --- ГЕНЕРАТОР БУКВ ---
VOWELS_UNIQUE = "АЕИОУЮЯ"
COMMON_CONSONANTS = "БВГДЗКЛМНПРСТ"
RARE_LIST = "ЙЦФЧШЩЬЫЖЭ"

def generate_grid(level):
    letters = []
    target_vowels = 4 if level == 10 else 3 if level == 8 else 2
    v_pool = list(VOWELS_UNIQUE)
    random.shuffle(v_pool)
    letters.extend(v_pool[:target_vowels])
    
    allow_rare = random.random() < 0.3
    cons_pool = list(COMMON_CONSONANTS + RARE_LIST)
    random.shuffle(cons_pool)
    
    rare_count = 0
    for c in cons_pool:
        if len(letters) >= level: break
        if c in RARE_LIST:
            if allow_rare and rare_count < 1:
                letters.append(c)
                rare_count += 1
        else:
            letters.append(c)
            
    if len(letters) < level:
        backup = list(COMMON_CONSONANTS)
        random.shuffle(backup)
        letters.extend(backup[:level - len(letters)])
        
    random.shuffle(letters)
    return letters

def send_tg(chat_id, text):
    if not BOT_TOKEN: return
    
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        res = requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}, timeout=10)
        result = res.json()
        if not result.get('ok'):
            print(f"❌ TG API Error (chat_id={chat_id}): {result}")
    except Exception as e: 
        print(f"❌ Send TG Exception: {e}")

import sys

# ... (импорты и конфиг те же)

def process_daily_update(session):
    print("🌅 Running DAILY UPDATE (00:00 UTC)...")
    
    last_challenge = session.query(Challenge).order_by(Challenge.id.desc()).first()
    
    # 1. Завершаем старое испытание
    if last_challenge and (not last_challenge.end_time or last_challenge.end_time <= datetime.now(timezone.utc)):
        # Проверка на идемпотентность: были ли уже подведены итоги?
        existing_broadcast = session.query(Broadcast).filter(Broadcast.message == f"RESULTS_READY:{last_challenge.id}").first()
        
        if existing_broadcast:
            print(f"⚠️ Challenge #{last_challenge.id} results already processed. Skipping.")
        else:
            print(f"🏁 Finishing challenge #{last_challenge.id}")
            
            scores = session.query(DailyScore).filter_by(challenge_id=last_challenge.id).order_by(DailyScore.score.desc()).all()
            
            if scores:
                game_date = (last_challenge.end_time - timedelta(days=1)).strftime("%d.%m.%Y")
                current_rank = 1
                for i, s in enumerate(scores):
                    if i > 0 and s.score < scores[i-1].score:
                        current_rank = i + 1
                    
                    rank = current_rank
                    bonus_amount = 3 if rank == 1 else 2 if rank == 2 else 1 if rank == 3 else 0
                    
                    user = session.query(Leaderboard).get(s.telegram_id)
                    if user:
                        # Начисляем бонусы
                        if bonus_amount > 0:
                            user.bonus_time = (user.bonus_time or 0) + bonus_amount
                            user.bonus_hint = (user.bonus_hint or 0) + bonus_amount
                            user.bonus_swap = (user.bonus_swap or 0) + bonus_amount
                            user.bonus_wildcard = (user.bonus_wildcard or 0) + bonus_amount
                            if rank == 1: user.daily_1_place += 1
                            elif rank == 2: user.daily_2_place += 1
                            elif rank == 3: user.daily_3_place += 1
                            
                            # Салют в игре
                            notif = Notification(
                                telegram_id=user.telegram_id,
                                type="daily_win",
                                data={"rank": rank, "score": s.score, "bonus_amount": bonus_amount, "date": game_date}
                            )
                            session.add(notif)
            
            # Помечаем, что итоги подведены (создаем отложенную рассылку)
            # Мы будем искать эту запись в 04:00
            session.add(Broadcast(message=f"RESULTS_READY:{last_challenge.id}", status='pending_results'))
            session.commit()

    # 2. Создаем новое
    if not last_challenge or (last_challenge.end_time and last_challenge.end_time <= datetime.now(timezone.utc)):
        print("🆕 Creating NEW challenge...")
        new_letters = {
            "10": generate_grid(10),
            "8": generate_grid(8),
            "6": generate_grid(6)
        }
        next_deadline = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        session.add(Challenge(letters=new_letters, end_time=next_deadline))
        session.commit()
        print("✅ New challenge created.")

def process_notifications(session):
    print("📢 Running NOTIFICATIONS (04:00 UTC)...")
    
    # Ищем отложенные результаты
    pending = session.query(Broadcast).filter_by(status='pending_results').first()
    if not pending:
        print("No pending results to broadcast.")
        return

    challenge_id = int(pending.message.split(':')[1])
    print(f"Broadcasting results for challenge #{challenge_id}")
    
    # Получаем дату челленджа для заголовка
    challenge = session.query(Challenge).get(challenge_id)
    date_str = ""
    if challenge and challenge.end_time:
        date_str = (challenge.end_time - timedelta(days=1)).strftime("%d.%m.%Y")
    else:
        # Fallback на вчерашнюю дату
        date_str = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%d.%m.%Y")
    
    scores = session.query(DailyScore).filter_by(challenge_id=challenge_id).order_by(DailyScore.score.desc()).all()
    
    current_rank = 1
    sent_count = 0
    
    for i, s in enumerate(scores):
        if i > 0 and s.score < scores[i-1].score:
            current_rank = i + 1
        
        rank = current_rank
        msg = f"🏁 <b>Итоги Дневного испытания ({date_str})</b>\n\nВы заняли <b>{rank}-е место</b> с результатом {s.score} очков!"
        if rank <= 3:
            msg += "\n\n🎉 ПОЗДРАВЛЯЕМ!\n🎁 Награда уже начислена!\n\n👏 Ждем вас в новом испытании!"
        else:
            msg += "\n\n💥 Попробуйте свои силы сегодня!\n👏 Ждем вас в новом испытании!"
        
        send_tg(s.telegram_id, msg)
        sent_count += 1
        time.sleep(0.05)
        
    pending.status = 'sent'
    pending.sent_count = sent_count
    pending.processed_at = datetime.now(timezone.utc)
    session.commit()
    print(f"✅ Broadcast complete. Sent: {sent_count}")

def main():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    if len(sys.argv) > 1:
        mode = sys.argv[1]
        if mode == 'update':
            process_daily_update(session)
        elif mode == 'notify':
            process_notifications(session)
        else:
            print("Unknown mode. Use 'update' or 'notify'.")
    else:
        print("Please provide a mode: 'update' or 'notify'.")

if __name__ == '__main__':
    main()