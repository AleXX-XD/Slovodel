import os
import json
import time
import requests
import argparse
import sys

# --- КОНФИГУРАЦИЯ ---
# Можно задать через переменные окружения или вписать сюда (но лучше через env)
FOLDER_ID = os.getenv("YANDEX_FOLDER_ID", "")
API_KEY = os.getenv("YANDEX_API_KEY", "")

# Файлы
INPUT_FILE = "public/words.txt"
OUTPUT_FILE = "yandex_definitions.json"
GEMINI_FILE = "gemini_definitions.json"
LIMIT = 40000 # Ограничение для одного запуска

# URL для YandexGPT
URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

# Force UTF-8 for stdout/stderr if possible, though explicit print replacement is safer
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

def load_env():
    """Простейшая загрузка .env файла, если он есть"""
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if "=" in line:
                    key, value = line.strip().split("=", 1)
                    os.environ[key] = value.strip('"').strip("'")

def get_definition(word):
    # Берем ключи заново, так как они могли загрузиться из .env
    folder_id = os.getenv("YANDEX_FOLDER_ID", "")
    api_key = os.getenv("YANDEX_API_KEY", "")
    
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
        response = requests.post(URL, headers=headers, json=prompt)
        response.raise_for_status()
        result = response.json()
        return result['result']['alternatives'][0]['message']['text'].strip().strip('"').strip("'")
    except Exception as e:
        print(f"Ошибка при запросе слова '{word}': {e}")
        return None

def main():
    load_env()
    folder_id = os.getenv("YANDEX_FOLDER_ID", "")
    api_key = os.getenv("YANDEX_API_KEY", "")

    if not folder_id or not api_key:
        print("ERROR: Не заданы YANDEX_FOLDER_ID или YANDEX_API_KEY.")
        return

    if not os.path.exists(INPUT_FILE):
        print(f"Файл {INPUT_FILE} не найден.")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        words = [line.strip() for line in f if line.strip()]

    print(f"Найдено {len(words)} слов. Лимит обработки: {LIMIT}")

    existing_data = []
    processed_words = set()
    
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                processed_words = {item['word'] for item in existing_data}
        except: pass

    if os.path.exists(GEMINI_FILE):
        try:
            with open(GEMINI_FILE, 'r', encoding='utf-8') as f:
                gemini_data = json.load(f)
                for item in gemini_data:
                    processed_words.add(item['word'])
        except: pass
    
    print(f"Уже обработано (суммарно): {len(processed_words)} слов.")

    count = 0
    try:
        for word in words:
            if count >= LIMIT:
                print(f"Достигнут лимит в {LIMIT} слов.")
                break
                
            if word in processed_words:
                continue

            definition = get_definition(word)
            if definition:
                print(f"+ {word}: {definition}")
                existing_data.append({"word": word, "definition": definition})
                count += 1
            
            if count % 5 == 0:
                with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                    json.dump(existing_data, f, ensure_ascii=False, indent=2)
            
            time.sleep(0.3)

    except KeyboardInterrupt:
        print("\nSTOP: Прервано.")
    finally:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        print(f"\nDONE: Готово. Сохранено в {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
