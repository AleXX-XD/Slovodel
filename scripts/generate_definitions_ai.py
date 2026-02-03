import os
import json
import requests
import time

# --- НАСТРОЙКИ YANDEX GPT ---
# Вставьте свои данные сюда или в переменные окружения
YANDEX_FOLDER_ID = os.getenv("YANDEX_FOLDER_ID", "") 
YANDEX_API_KEY = os.getenv("YANDEX_API_KEY", "") 

# Файлы
INPUT_FILE = "missing.txt"
OUTPUT_FILE = "ai_definitions.json"

def generate_definitions():
    if not YANDEX_FOLDER_ID or not YANDEX_API_KEY:
        print("❌ ОШИБКА: Не заданы YANDEX_FOLDER_ID или YANDEX_API_KEY.")
        print("Получите их в консоли Yandex Cloud и вставьте в скрипт.")
        return

    # 1. Читаем список отсутствующих слов
    if not os.path.exists(INPUT_FILE):
        print(f"Файл {INPUT_FILE} не найден. Сначала запустите audit_and_fix.py")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        words = [line.strip() for line in f if line.strip()]

    print(f"Всего слов для обработки: {len(words)}")

    # Попробуем догрузить уже готовые, чтобы можно было прерывать скрипт
    processed_data = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                processed_list = json.load(f)
                for item in processed_list:
                    processed_data[item['word']] = item['definition']
            print(f"Уже готово: {len(processed_data)} слов. Продолжаем...")
        except:
            pass

    # Отфильтруем уже сделанные
    words_to_do = [w for w in words if w not in processed_data]
    print(f"Осталось обработать: {len(words_to_do)}")

    url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Api-Key {YANDEX_API_KEY}",
        "x-folder-id": YANDEX_FOLDER_ID
    }

    results = []
    # Восстанавливаем список из dict для сохранения
    for w, d in processed_data.items():
        results.append({"word": w, "definition": d, "source": "yandex_gpt"})

    count = 0
    
    # Обрабатываем по одному слову (YandexGPT Lite довольно быстр)
    for word in words_to_do:
        prompt = {
            "modelUri": f"gpt://{YANDEX_FOLDER_ID}/yandexgpt-lite",
            "completionOptions": {
                "stream": False,
                "temperature": 0.3, # Поменьше креатива, больше фактов
                "maxTokens": "50"
            },
            "messages": [
                {
                    "role": "system",
                    "text": "Ты - толковый словарь. Дай краткое, сухое определение слову. Максимум 1 предложение. Без вводных фраз типа 'Это...'."
                },
                {
                    "role": "user",
                    "text": f"Слово: {word}"
                }
            ]
        }

        try:
            response = requests.post(url, headers=headers, json=prompt)
            
            if response.status_code == 200:
                result = response.json()
                definition = result['result']['alternatives'][0]['message']['text'].strip()
                
                # Очистка от лишних символов
                definition = definition.replace(" - это", "").strip()
                if definition.endswith('.'): definition = definition[:-1] # Уберем точку для красоты, потом добавим если надо

                print(f"✅ {word}: {definition}")
                
                results.append({
                    "word": word,
                    "definition": definition,
                    "source": "yandex_gpt"
                })
                count += 1

                # Сохраняем каждые 10 слов, чтобы не потерять прогресс
                if count % 10 == 0:
                    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                        json.dump(results, f, ensure_ascii=False, indent=2)
                        
                time.sleep(0.3) # Лимиты (около 10 RPS, но лучше перестраховаться)
            else:
                print(f"⚠️ Ошибка API ({response.status_code}): {response.text}")
                time.sleep(2) # Пауза при ошибке

        except Exception as e:
            print(f"❌ Критическая ошибка: {e}")
            time.sleep(1)

    # Финальное сохранение
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Готово! Файл {OUTPUT_FILE} создан.")
    print("Теперь запустите upload_definitions.py, указав этот файл в LOCAL_FILE.")

if __name__ == "__main__":
    generate_definitions()
