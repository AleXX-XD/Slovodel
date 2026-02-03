import os
import json
import requests
import time

# Конфигурация
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://viyqhdvziizfvokmkrgb.supabase.co")
# Вставьте ключ, если он не в env
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "") 

# Теперь грузим файл, созданный Gemini
LOCAL_FILE = "gemini_definitions.json"

def upload_dictionary():
    if not SUPABASE_KEY:
        print("❌ Ошибка: Не задан SUPABASE_KEY")
        return

    file_path = os.path.join(os.getcwd(), LOCAL_FILE)
    if not os.path.exists(file_path):
        print(f"❌ Файл {LOCAL_FILE} не найден.")
        return

    print(f"Чтение файла {LOCAL_FILE}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Ошибка чтения JSON: {e}")
        return

    total_items = len(data)
    print(f"Найдено записей: {total_items}")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    endpoint = f"{SUPABASE_URL}/rest/v1/definitions"

    batch_size = 500
    total_uploaded = 0

    print("Начинаем загрузку в Supabase...")

    for i in range(0, total_items, batch_size):
        batch = data[i:i + batch_size]
        
        # Фильтрация пустых
        payload = [item for item in batch if item['word'] and len(item['definition']) > 2]

        if not payload: continue

        try:
            res = requests.post(endpoint, headers=headers, json=payload)
            res.raise_for_status()
            
            total_uploaded += len(payload)
            if total_uploaded % 2000 == 0:
                print(f"Загружено {total_uploaded} / {total_items}")
                
        except Exception as e:
            print(f"⚠️ Ошибка пакета: {e}")
            time.sleep(1)

    print(f"\n✅ Загрузка завершена! Всего добавлено: {total_uploaded}")

if __name__ == "__main__":
    upload_dictionary()
