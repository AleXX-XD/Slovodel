import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Разрешаем запросы из браузера

WORDS_FILE = os.path.join("public", "words.json")
YANDEX_FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")
YANDEX_API_KEY = os.getenv("YANDEX_API_KEY")
YANDEX_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

def load_words():
    if not os.path.exists(WORDS_FILE):
        return []
    with open(WORDS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_words(data):
    # Сортируем перед сохранением
    data.sort(key=lambda x: x['word'])
    with open(WORDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def generate_yandex_definition(word):
    if not YANDEX_FOLDER_ID or not YANDEX_API_KEY:
        print("⚠️ Нет ключей Yandex Cloud")
        return None

    prompt = {
        "modelUri": f"gpt://{YANDEX_FOLDER_ID}/yandexgpt-lite/latest",
        "completionOptions": {"stream": False, "temperature": 0.3, "maxTokens": 100},
        "messages": [
            {"role": "system", "text": "Ты — толковый словарь. Дай краткое определение слову в именительном падеже. Без вводных слов."},
            {"role": "user", "text": f"Определение слова: {word}"}
        ]
    }
    
    try:
        response = requests.post(YANDEX_URL, headers={"Authorization": f"Api-Key {YANDEX_API_KEY}"}, json=prompt)
        result = response.json()
        return result['result']['alternatives'][0]['message']['text'].strip()
    except Exception as e:
        print(f"Ошибка Yandex: {e}")
        return None

@app.route('/words', methods=['GET'])
def get_words():
    """Получить список слов (для админки)"""
    words = load_words()
    # Добавляем фиктивные ID, так как админка ожидает id
    result = [{"id": i, "word": w["word"], "definition": w.get("definition", "")} for i, w in enumerate(words)]
    # Возвращаем последние добавленные сверху (обратный порядок для админки не обязателен, но удобен, 
    # но так как у нас нет даты создания, просто вернем как есть или перевернем)
    return jsonify(result[::-1]) 

@app.route('/add', methods=['POST'])
def add_word():
    data = request.json
    word = data.get('word', '').strip().lower()
    
    if not word:
        return jsonify({"success": False, "error": "Empty word"}), 400

    words_list = load_words()
    
    # Проверка на дубликат
    if any(w['word'] == word for w in words_list):
        return jsonify({"success": False, "error": "Word exists"}), 400

    definition = data.get('definition')
    
    # Если определения нет, генерируем
    if not definition:
        print(f"🤖 Генерируем определение для: {word}")
        definition = generate_yandex_definition(word)
        if not definition:
            definition = "Определение добавлено вручную."

    new_entry = {"word": word, "definition": definition}
    words_list.append(new_entry)
    save_words(words_list)
    
    print(f"✅ Добавлено: {word}")
    return jsonify({"success": True, "word": word, "definition": definition})

@app.route('/update', methods=['POST'])
def update_word():
    data = request.json
    # Админка передает ID, который является индексом в перевернутом списке, 
    # это ненадежно при прямом редактировании файла.
    # Поэтому будем искать по старому слову, которое нужно передать, или надеяться, что ID совпадает.
    # Лучшая стратегия для JSON файла: искать по слову.
    
    # В текущей реализации frontend передает id. Но id в json нет.
    # Мы будем искать по слову. Но если мы меняем само слово?
    # Давайте упростим: Frontend должен передать `oldWord` если слово меняется.
    
    # Но пока админка шлет id.
    # В методе get_words мы генерировали id = index.
    # Если список не менялся между запросами, id валиден.
    
    target_id = data.get('id')
    new_word = data.get('word').strip().lower()
    new_def = data.get('definition')

    words_list = load_words()
    
    # Конвертируем "обратный" ID обратно в прямой индекс
    # В get_words мы делали result[::-1]
    # Значит реальный индекс = len - 1 - target_id
    real_index = len(words_list) - 1 - target_id

    if 0 <= real_index < len(words_list):
        words_list[real_index]['word'] = new_word
        if new_def:
            words_list[real_index]['definition'] = new_def
        
        save_words(words_list)
        print(f"✏️ Обновлено: {new_word}")
        return jsonify({"success": True})
    
    return jsonify({"success": False, "error": "Index out of bounds"}), 404

@app.route('/delete', methods=['POST'])
def delete_word():
    data = request.json
    target_id = data.get('id')
    
    words_list = load_words()
    real_index = len(words_list) - 1 - target_id # Учитываем реверс списка в get_words

    if 0 <= real_index < len(words_list):
        removed = words_list.pop(real_index)
        save_words(words_list)
        print(f"🗑 Удалено: {removed['word']}")
        return jsonify({"success": True})

    return jsonify({"success": False, "error": "Not found"}), 404

if __name__ == '__main__':
    print("🚀 Local Dictionary Server running on http://localhost:5000")
    app.run(port=5000, debug=True)
