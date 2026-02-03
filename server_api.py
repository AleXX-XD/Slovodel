import os
print("✅ LOADED UPDATED SERVER_API V2")
import json
import hashlib
import hmac
import jwt
from urllib.parse import parse_qsl
from functools import wraps
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

import requests

app = Flask(__name__)
# Самая простая и разрешающая настройка CORS
CORS(app)

# ПРИНУДИТЕЛЬНЫЕ ЗАГОЛОВКИ (Если Flask-Cors не справляется)
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

# Конфигурация
def get_db_url():
    user = os.environ.get('POSTGRES_USER')
    pw = os.environ.get('POSTGRES_PASSWORD')
    db_name = os.environ.get('POSTGRES_DB')
    host = os.environ.get('POSTGRES_HOST', 'localhost')
    
    if all([user, pw, db_name]):
        return f"postgresql+psycopg2://{user}:{pw}@{host}:5432/{db_name}"
    
    url = os.environ.get('DATABASE_URL', 'sqlite:///slovodel.db')
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url

app.config['SQLALCHEMY_DATABASE_URI'] = get_db_url()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
BOT_TOKEN = os.environ.get('BOT_TOKEN')
SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-key') # Для JWT
YANDEX_FOLDER_ID = os.environ.get('YANDEX_FOLDER_ID')
YANDEX_API_KEY = os.environ.get('YANDEX_API_KEY')
YANDEX_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
ADMIN_IDS = [int(x) for x in os.environ.get('VITE_ADMIN_IDS', '').split(',') if x.strip()]

db = SQLAlchemy(app)

# Логирование запросов для отладки
@app.before_request
def log_request():
    print(f"📡 Request: {request.method} {request.path}")

def send_telegram_message(chat_id, text):
    if not BOT_TOKEN: 
        print("⚠️ BOT_TOKEN missing, skipping TG message.")
        return
        
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        res = requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})
        result = res.json()
        if not result.get('ok'):
            print(f"❌ TG API Error: {result}")
    except Exception as e:
        print(f"❌ Failed to send TG message: {e}")

# --- ВАЛИДАЦИЯ TELEGRAM ---

def validate_init_data(init_data):
    """Валидация для Telegram Mini App (initData)"""
    if not BOT_TOKEN: return None
    try:
        parsed_data = dict(parse_qsl(init_data))
        if 'hash' not in parsed_data: return None
        received_hash = parsed_data.pop('hash')
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        if calculated_hash == received_hash:
            return json.loads(parsed_data.get('user', '{}'))
        return None
    except: return None

def validate_login_widget(data):
    """Валидация для Telegram Login Widget (браузер)"""
    if not BOT_TOKEN: return None
    try:
        check_hash = data.pop('hash')
        # Сборка строки: key=value\nkey=value...
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
        # Секретный ключ для виджета - это SHA256 от токена бота
        secret_key = hashlib.sha256(BOT_TOKEN.encode()).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        if calculated_hash == check_hash:
            return data # Возвращает данные пользователя
        return None
    except: return None

def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Unauthorized"}), 401
        # 1. Пробуем как JWT (Браузер)
        if auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                g.user_id = payload['user_id']
                # В JWT мы уже сохранили имя при логине
                g.username = payload['username']
                return f(*args, **kwargs)
            except:
                return jsonify({"error": "Invalid Token"}), 403

        # 2. Пробуем как initData (Mini App)
        user_data = validate_init_data(auth_header)
        if user_data:
            g.user_id = user_data.get('id')
            # Собираем имя из компонентов
            f_name = user_data.get('first_name', '')
            l_name = user_data.get('last_name', '')
            g.username = f"{f_name} {l_name}".strip() or user_data.get('username') or f"Игрок {g.user_id}"
            return f(*args, **kwargs)

        return jsonify({"error": "Forbidden"}), 403
    return decorated_function

# --- МОДЕЛИ (Оставляем как есть) ---
class Leaderboard(db.Model):
    __tablename__ = 'leaderboard'
    telegram_id = db.Column(db.BigInteger, primary_key=True)
    username = db.Column(db.Text, nullable=False)
    avatar_url = db.Column(db.Text)
    score = db.Column(db.BigInteger, default=0)
    high_score = db.Column(db.BigInteger, default=0)
    coins = db.Column(db.Integer, default=0)
    bonus_time = db.Column(db.Integer, default=2)
    bonus_hint = db.Column(db.Integer, default=2)
    bonus_swap = db.Column(db.Integer, default=2)
    bonus_wildcard = db.Column(db.Integer, default=2)
    streak = db.Column(db.Integer, default=0)
    total_words = db.Column(db.Integer, default=0)
    days_played = db.Column(db.Integer, default=0)
    rare_words = db.Column(db.JSON)
    daily_1_place = db.Column(db.Integer, default=0)
    daily_2_place = db.Column(db.Integer, default=0)
    daily_3_place = db.Column(db.Integer, default=0)
    marathon_high_score = db.Column(db.BigInteger, default=0)
    claimed_rewards = db.Column(db.JSON, default=[])
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class DailyScore(db.Model):
    __tablename__ = 'daily_scores'
    id = db.Column(db.BigInteger, primary_key=True)
    telegram_id = db.Column(db.BigInteger, nullable=False)
    challenge_id = db.Column(db.BigInteger)
    score = db.Column(db.Integer, nullable=False)
    game_date = db.Column(db.Text, nullable=False)
    username = db.Column(db.Text)
    avatar_url = db.Column(db.Text)
    bonus_time = db.Column(db.Integer, default=2)
    bonus_hint = db.Column(db.Integer, default=2)
    bonus_swap = db.Column(db.Integer, default=2)
    bonus_wildcard = db.Column(db.Integer, default=2)
    level_scores = db.Column(db.JSON)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

class Challenge(db.Model):
    __tablename__ = 'challenges'
    id = db.Column(db.BigInteger, primary_key=True)
    letters = db.Column(db.JSON, nullable=False)
    end_time = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

class Feedback(db.Model):
    __tablename__ = 'feedback'
    id = db.Column(db.BigInteger, primary_key=True)
    telegram_id = db.Column(db.BigInteger)
    username = db.Column(db.Text)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.Text, default='new')
    admin_reply = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.BigInteger, primary_key=True)
    telegram_id = db.Column(db.BigInteger, nullable=False)
    type = db.Column(db.Text, nullable=False)
    data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.String, primary_key=True) # Telegram Transaction ID
    telegram_id = db.Column(db.BigInteger, nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    pack_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

def get_words_local():
    path = os.path.join("public", "words.json")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f: return json.load(f)
    return []

def save_words_local(words):
    path = os.path.join("public", "words.json")
    path_list = os.path.join("public", "words_list.json")
    
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    # Полный словарь
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, indent=2)
        
    # Легкий словарь (только слова)
    word_list = [w['word'] for w in words if 'word' in w]
    with open(path_list, 'w', encoding='utf-8') as f:
        json.dump(word_list, f, ensure_ascii=False)

def ensure_words_list():
    path_list = os.path.join("public", "words_list.json")
    if not os.path.exists(path_list):
        print("⚠️ words_list.json not found. Generating from words.json...")
        words = get_words_local()
        save_words_local(words)
        print("✅ words_list.json generated.")

# Запускаем проверку при старте модуля
ensure_words_list()

# ... (helpers)

@app.route('/api/payment/create-invoice', methods=['POST'])
@auth_required
def create_invoice():
    data = request.json
    pack_id = data.get('packId')
    
    packs = {
        1: {"amount": 100, "price": 50, "label": "Горсть словокоинов"},
        2: {"amount": 250, "price": 100, "label": "Мешочек словокоинов"},
        3: {"amount": 500, "price": 200, "label": "Сундук словокоинов"},
        4: {"amount": 1000, "price": 350, "label": "Сокровищница"},
        5: {"amount": 1500, "price": 500, "label": "Гора золота"},
    }
    
    item = packs.get(pack_id)
    if not item: return jsonify({"error": "Invalid pack"}), 400

    title = item['label']
    description = f"Пополнение баланса на {item['amount']} монет"
    payload = f"pack_{pack_id}" # Просто ID пака
    currency = "XTR"
    prices = [{"label": title, "amount": item['price']}] 

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/createInvoiceLink"
    params = {
        "title": title,
        "description": description,
        "payload": payload,
        "provider_token": "", 
        "currency": currency,
        "prices": json.dumps(prices)
    }
    
    try:
        res = requests.post(url, json=params)
        result = res.json()
        if result.get('ok'):
            return jsonify({"invoiceLink": result['result']})
        else:
            print(f"TG Invoice Error: {result}")
            return jsonify({"error": "TG Error"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/payment/verify', methods=['POST'])
@auth_required
def verify_payment():
    # Проверяем последние транзакции звезд
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getStarTransactions"
    try:
        res = requests.get(url, params={"limit": 20}) # Берем последние 20
        result = res.json()
        
        if not result.get('ok'):
            return jsonify({"success": False, "error": "TG API Error"}), 500
            
        transactions = result['result']['transactions']
        
        # Ищем транзакцию от нашего юзера, которая еще не сохранена в БД
        for tx in transactions:
            if tx.get('source_update_type') != 'message': # Мы ищем платежи? Нет, source может быть разным
                pass
            
            # Проверяем получателя (это должен быть мы, но getStarTransactions возвращает наши входящие/исходящие)
            # Входящая транзакция имеет receiver = null (если это мы) или partner?
            # В документации: partner_id - user id. 
            
            partner_id = tx.get('partner_id') # Кто платил? (deprecated? use partner.id)
            if not partner_id:
                 partner = tx.get('partner')
                 if partner: partner_id = partner.get('id')

            if partner_id != g.user_id:
                continue
                
            tx_id = tx['id']
            amount = tx['amount'] # Количество звезд
            date = tx['date']
            
            # Проверяем, не слишком ли старая (например, 1 час)
            if datetime.now().timestamp() - date > 3600:
                continue

            # Проверяем, есть ли уже в БД
            if Payment.query.get(tx_id):
                continue
                
            # Нашли новую транзакцию от юзера!
            # Определяем пак по сумме (ненадежно, если цены одинаковые, но для MVP пойдет)
            # Или надеяться, что invoice payload где-то есть? В getStarTransactions payload инвойса НЕТ.
            # Поэтому матчим по цене.
            
            packs = {
                50: {"id": 1, "coins": 100},
                100: {"id": 2, "coins": 250},
                200: {"id": 3, "coins": 500},
                350: {"id": 4, "coins": 1000},
                500: {"id": 5, "coins": 1500},
            }
            
            pack = packs.get(amount)
            if not pack:
                continue # Неизвестная сумма
                
            # Начисляем!
            user = Leaderboard.query.get(g.user_id)
            user.coins += pack['coins']
            
            payment = Payment(
                id=tx_id,
                telegram_id=g.user_id,
                amount=amount,
                pack_id=pack['id']
            )
            db.session.add(payment)
            db.session.commit()
            
            send_telegram_message(g.user_id, f"💰 <b>Покупка успешна!</b>\nНачислено: {pack['coins']} монет.")
            
            return jsonify({"success": True, "coins": user.coins, "added": pack['coins']})
            
        return jsonify({"success": False, "error": "Transaction not found"}), 404
        
    except Exception as e:
        print(f"Verify Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

def generate_yandex_definition(word):
    folder_id = os.environ.get("YANDEX_FOLDER_ID", "")
    api_key = os.environ.get("YANDEX_API_KEY", "")
    
    if not folder_id or not api_key:
        print("Yandex credentials not found")
        return None

    prompt = {
        "modelUri": f"gpt://{folder_id}/yandexgpt-lite/latest",
        "completionOptions": {
            "stream": False,
            "temperature": 0.3,
            "maxTokens": 100
        },
        "messages": [
            {
                "role": "system",
                "text": "Ты — толковый словарь русского языка. Твоя задача — давать краткие, точные определения словам для игры 'Словодел'. Определение должно быть в именительном падеже, без лишних вводных слов (типа 'это', 'слово означает'). Не используй само слово в определении."
            },
            {
                "role": "user",
                "text": f"Дай определение слову: {word}"
            }
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Api-Key {api_key}"
    }

    try:
        response = requests.post("https://llm.api.cloud.yandex.net/foundationModels/v1/completion", headers=headers, json=prompt)
        response.raise_for_status()
        result = response.json()
        return result['result']['alternatives'][0]['message']['text'].strip().strip('"').strip("'")
    except Exception as e:
        print(f"Ошибка генерации определения для '{word}': {e}")
        return None

@app.route('/api/words/search', methods=['GET'])
def search_word_api():
    query = request.args.get('q', '').strip().lower()
    if not query: return jsonify(None)
    
    words = get_words_local()
    # Ищем точное совпадение
    found = next((w for w in words if w['word'] == query), None)
    if found:
        return jsonify(found)
    return jsonify(None)

@app.route('/api/words/add', methods=['POST'])
def add_word_api():
    data = request.json
    word = data.get('word', '').strip().lower()
    if not word: return jsonify({"success": False}), 400
    
    words = get_words_local()
    if any(w['word'] == word for w in words): return jsonify({"success": False, "error": "Exists"}), 400
    
    definition = data.get('definition')
    if not definition:
        definition = generate_yandex_definition(word) or "Определение добавлено вручную."
        
    words.append({"word": word, "definition": definition})
    # Сортируем по алфавиту для порядка
    words.sort(key=lambda x: x['word'])
    save_words_local(words)
    return jsonify({"success": True, "word": word, "definition": definition})

@app.route('/api/feedback/reply', methods=['POST'])
def reply_feedback():
    data = request.json
    fb_id = data.get('id')
    text = data.get('text')
    
    fb = Feedback.query.get(fb_id)
    if fb:
        fb.admin_reply = text
        fb.status = 'replied'
        db.session.commit()
        
        # Отправляем ответ пользователю в Telegram
        if fb.telegram_id:
            send_telegram_message(fb.telegram_id, f"🔔 <b>Ответ от администратора:</b>\n\n{text}")
            
        return jsonify({"success": True})
    return jsonify({"success": False}), 404

@app.route('/api/words/update', methods=['POST'])
def update_word_api():
    data = request.json
    word = data.get('word', '').strip().lower()
    new_def = data.get('definition')
    
    words = get_words_local()
    # Ищем индекс слова
    for i, w in enumerate(words):
        if w['word'] == word:
            words[i]['definition'] = new_def
            save_words_local(words)
            return jsonify({"success": True})
            
    return jsonify({"success": False, "error": "Not found"}), 404

@app.route('/api/words/delete', methods=['POST'])
def delete_word_api():
    data = request.json
    # Принимаем либо id (для совместимости), либо слово
    target_word = data.get('word')
    
    words = get_words_local()
    
    initial_len = len(words)
    if target_word:
        words = [w for w in words if w['word'] != target_word.strip().lower()]
    else:
        # Старый метод по ID (лучше избегать)
        target_id = data.get('id')
        if target_id is not None:
             # Это ненадежно без постоянных ID, но оставим как fallback
             real_index = len(words) - 1 - target_id
             if 0 <= real_index < len(words):
                 words.pop(real_index)

    if len(words) < initial_len:
        save_words_local(words)
        return jsonify({"success": True})
    return jsonify({"success": False}), 404

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

# Авторизация через виджет (браузер)
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user_data = validate_login_widget(data)
    if not user_data:
        return jsonify({"error": "Invalid auth"}), 400
    
    user_id = int(user_data['id'])
    # Собираем имя из того, что прислал виджет
    f_name = user_data.get('first_name', '')
    l_name = user_data.get('last_name', '')
    full_name = f"{f_name} {l_name}".strip() or user_data.get('username') or f"Игрок {user_id}"
    
    # Создаем юзера если нет
    user = Leaderboard.query.get(user_id)
    if not user:
        user = Leaderboard(telegram_id=user_id, username=full_name, avatar_url=user_data.get('photo_url'))
        db.session.add(user)
    else:
        # Обновляем данные при каждом входе
        user.username = full_name
        user.avatar_url = user_data.get('photo_url')
        
    db.session.commit()

    # Генерируем JWT (на 30 дней)
    token = jwt.encode({
        "user_id": user_id,
        "username": full_name,
        "exp": datetime.utcnow() + timedelta(days=30)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({"token": token, "user": user.to_dict()})

# Тестовый вход для локальной разработки
@app.route('/api/user/me')
@auth_required
def get_my_user():
    user = Leaderboard.query.get(g.user_id)
    if user: return jsonify(user.to_dict())
    return jsonify(None), 404

@app.route('/api/user/<int:telegram_id>')
def get_user_public(telegram_id):
    user = Leaderboard.query.get(telegram_id)
    if user: return jsonify(user.to_dict())
    return jsonify(None), 404

@app.route('/api/user', methods=['POST'])
@auth_required
def save_user():
    data = request.json
    telegram_id = g.user_id # БЕРЕМ ИЗ ТОКЕНА!
    
    user = Leaderboard.query.get(telegram_id)
    if not user:
        user = Leaderboard(
            telegram_id=telegram_id, 
            username=g.username
        )
        db.session.add(user)
    
    user.username = g.username
    user.avatar_url = data.get('avatarUrl', user.avatar_url)
    user.score = data.get('score', user.score)
    user.high_score = data.get('highScore', user.high_score)
    user.coins = data.get('coins', user.coins)
    
    bonuses = data.get('bonuses', {})
    if bonuses:
        user.bonus_time = bonuses.get('time', user.bonus_time)
        user.bonus_hint = bonuses.get('hint', user.bonus_hint)
        user.bonus_swap = bonuses.get('swap', user.bonus_swap)
        user.bonus_wildcard = bonuses.get('wildcard', user.bonus_wildcard)
        
    user.streak = data.get('streak', user.streak)
    user.total_words = data.get('totalWords', user.total_words)
    user.days_played = data.get('daysPlayed', user.days_played)
    user.rare_words = data.get('rareWords', user.rare_words)
    user.marathon_high_score = data.get('marathonHighScore', user.marathon_high_score)
    
    db.session.commit()
    return jsonify({"success": True})


from sqlalchemy import func

@app.route('/api/rank')
@auth_required
def get_my_rank():
    return get_user_rank_public(g.user_id)

@app.route('/api/rank/<int:telegram_id>')
def get_user_rank_public(telegram_id):
    user = Leaderboard.query.get(telegram_id)
    if not user: return jsonify({"rank": 0})
    
    # Dense Rank
    higher_scores_count = db.session.query(func.count(func.distinct(Leaderboard.score))).filter(Leaderboard.score > user.score).scalar()
    rank = higher_scores_count + 1
    
    return jsonify({"rank": rank})

@app.route('/api/daily/score', methods=['POST'])
@auth_required
def save_daily_score():
    data = request.json
    telegram_id = g.user_id
    
    try:
        challenge_id_int = int(data.get('challengeId', 0))
    except:
        challenge_id_int = 0

    entry = DailyScore.query.filter_by(telegram_id=telegram_id, challenge_id=challenge_id_int).first()
    if not entry:
        entry = DailyScore(telegram_id=telegram_id, challenge_id=challenge_id_int, game_date=datetime.utcnow().strftime('%Y-%m-%d'), score=0)
        db.session.add(entry)
    
    entry.score = data.get('score', 0)
    entry.username = g.username
    entry.avatar_url = data.get('avatarUrl')
    entry.level_scores = data.get('levelScores', {})
    
    entry.bonus_time = data.get('bonus_time')
    entry.bonus_hint = data.get('bonus_hint')
    entry.bonus_swap = data.get('bonus_swap')
    entry.bonus_wildcard = data.get('bonus_wildcard')

    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/daily/check', methods=['GET'])
@auth_required
def check_daily_score():
    telegram_id = g.user_id
    challenge_id = request.args.get('challengeId')
    try: cid = int(challenge_id)
    except: return jsonify(None)

    entry = DailyScore.query.filter_by(telegram_id=telegram_id, challenge_id=cid).first()
    if entry:
        return jsonify({
            "telegram_id": entry.telegram_id,
            "challenge_id": str(entry.challenge_id),
            "score": entry.score,
            "level_scores": entry.level_scores,
            "bonus_time": entry.bonus_time,
            "bonus_hint": entry.bonus_hint,
            "bonus_swap": entry.bonus_swap,
            "bonus_wildcard": entry.bonus_wildcard
        })
    return jsonify(None)

@app.route('/api/notifications', methods=['GET'])
@auth_required
def get_notifications():
    notifs = Notification.query.filter_by(telegram_id=g.user_id).all()
    return jsonify([{
        "id": n.id,
        "type": n.type,
        "data": n.data
    } for n in notifs])

@app.route('/api/notifications/<int:id>', methods=['DELETE'])
@auth_required
def delete_notification(id):
    Notification.query.filter_by(id=id, telegram_id=g.user_id).delete()
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/leaderboard')
def get_leaderboard():
    users = Leaderboard.query.order_by(Leaderboard.score.desc()).limit(20).all()
    count = db.session.query(Leaderboard).count()
    return jsonify({
        "players": [{"name": u.username, "score": u.score, "avatar_url": u.avatar_url, "telegram_id": u.telegram_id} for u in users],
        "count": count
    })

@app.route('/api/daily/leaderboard')
def get_daily_leaderboard():
    try: cid = int(request.args.get('challengeId', 0))
    except: return jsonify({"players": [], "count": 0})
    scores = DailyScore.query.filter_by(challenge_id=cid).order_by(DailyScore.score.desc()).limit(50).all()
    count = DailyScore.query.filter_by(challenge_id=cid).count()
    return jsonify({"players": [{"name": s.username, "score": s.score, "avatar_url": s.avatar_url, "telegram_id": s.telegram_id} for s in scores], "count": count})

@app.route('/api/broadcast', methods=['POST'])
@auth_required
def send_broadcast_api():
    # Проверка на админа желательна
    if g.user_id not in ADMIN_IDS:
        return jsonify({"error": "Forbidden"}), 403

    data = request.json
    text = data.get('message')
    if not text: return jsonify({"error": "Empty message"}), 400
    
    # Сохраняем в историю
    # (Модель Broadcast не была объявлена в server_api.py, но она есть в init_db.sql. 
    # Если мы хотим использовать ORM, надо добавить класс. Пока просто разошлем).
    
    # Рассылка
    users = Leaderboard.query.all()
    count = 0
    for u in users:
        try:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
            requests.post(url, json={"chat_id": u.telegram_id, "text": text, "parse_mode": "HTML"})
            count += 1
        except: pass
        
    return jsonify({"success": True, "count": count})

@app.route('/api/feedback', methods=['POST'])
@auth_required
def save_feedback():
    print(f"📨 Feedback received from {g.username}")
    data = request.json
    message_text = data.get('message', '')
    
    fb = Feedback(
        telegram_id=g.user_id, 
        username=g.username, 
        message=message_text
    )
    db.session.add(fb)
    db.session.commit()
    
    # Уведомляем админов
    notify_text = f"📩 <b>Новый отзыв!</b>\n\n👤 <b>От:</b> {g.username} (ID: {g.user_id})\n📝 <b>Сообщение:</b> {message_text}"
    for admin_id in ADMIN_IDS:
        # В HTML режиме для красоты
        try:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
            requests.post(url, json={"chat_id": admin_id, "text": notify_text, "parse_mode": "HTML"})
        except: pass

    return jsonify({"success": True})

@app.route('/api/feedback/list', methods=['GET'])
def get_feedbacks():
    # В будущем добавить проверку на админа
    feedbacks = Feedback.query.order_by(Feedback.created_at.desc()).all()
    return jsonify([{
        "id": f.id,
        "telegram_id": f.telegram_id,
        "username": f.username,
        "message": f.message,
        "status": f.status,
        "admin_reply": f.admin_reply,
        "created_at": f.created_at.isoformat() if f.created_at else None
    } for f in feedbacks])

@app.route('/api/feedback/archive', methods=['POST'])
def archive_feedback():
    data = request.json
    fb_id = data.get('id')
    fb = Feedback.query.get(fb_id)
    if fb:
        fb.status = 'archived'
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False}), 404

@app.route('/api/feedback/delete', methods=['POST'])
def delete_feedback_api():
    data = request.json
    fb_id = data.get('id')
    fb = Feedback.query.get(fb_id)
    if fb:
        db.session.delete(fb)
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False}), 404

@app.route('/api/challenge/active')
def get_active_challenge():
    challenge = Challenge.query.order_by(Challenge.id.desc()).first()
    if challenge:
        return jsonify({
            "id": str(challenge.id),
            "letters": challenge.letters,
            "endTime": challenge.end_time.isoformat() if challenge.end_time else None
        })
    return jsonify(None)


@app.route('/api/rewards/claim', methods=['POST'])
@auth_required
def claim_reward():
    data = request.json
    reward_id = data.get('rewardId')
    multiplier = data.get('multiplier', 1)
    
    if not reward_id: return jsonify({"error": "No ID"}), 400
    
    user = Leaderboard.query.get(g.user_id)
    
    # Инициализируем если None (хотя default=[])
    if user.claimed_rewards is None:
        user.claimed_rewards = []
    
    # Копия списка для мутации (SQLAlchemy JSON mutable fix)
    current_rewards = list(user.claimed_rewards)
    
    if reward_id in current_rewards:
        return jsonify({"success": False, "error": "Already claimed"}), 400
        
    # Выдаем награды (1 шт каждого типа * множитель)
    amount = 1 * multiplier
    
    user.bonus_time += amount
    user.bonus_hint += amount
    user.bonus_swap += amount
    user.bonus_wildcard += amount
    
    current_rewards.append(reward_id)
    user.claimed_rewards = current_rewards
    
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "bonuses": {
            "time": user.bonus_time,
            "hint": user.bonus_hint,
            "swap": user.bonus_swap,
            "wildcard": user.bonus_wildcard
        }
    })


import time

if __name__ == '__main__':
    with app.app_context():
        # Простая логика ожидания базы данных
        for _ in range(10):
            try:
                db.create_all()
                print("✅ Database connected and tables created!")
                break
            except Exception as e:
                print(f"⏳ Waiting for DB... ({e})")
                time.sleep(3)
                
    app.run(host='0.0.0.0', port=5000)
