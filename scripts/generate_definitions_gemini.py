import os
import json
import time
import google.generativeai as genai

# --- НАСТРОЙКИ GEMINI ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyBMg6_Z_cpRyxcUVhuR7qWrdHsJGo0TSY0") 

# Файлы
INPUT_FILE = "missing.txt"
OUTPUT_FILE = "gemini_definitions.json"

def generate_definitions():
    if not GOOGLE_API_KEY:
        print("❌ ОШИБКА: Не задан GOOGLE_API_KEY.")
        return

    genai.configure(api_key="YOUR_GEMINI_API_KEY")
    
    # ПРОВЕРКА ДОСТУПНЫХ МОДЕЛЕЙ
    print("Проверка доступных моделей...")
    available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
    
    model_name = 'models/gemini-1.5-flash'
    if model_name not in available_models:
        print(f"⚠️ Модель {model_name} не найдена.")
        # Пробуем найти любую версию flash или pro
        flash_models = [m for m in available_models if 'flash' in m]
        if flash_models:
            model_name = flash_models[0]
            print(f"🔄 Использую альтернативу: {model_name}")
        else:
            model_name = 'models/gemini-pro'
            print(f"🔄 Использую базовую модель: {model_name}")

    model = genai.GenerativeModel(model_name)

    # 1. Читаем список
    if not os.path.exists(INPUT_FILE):
        print(f"Файл {INPUT_FILE} не найден.")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        words = [line.strip() for line in f if line.strip()]

    print(f"Всего слов: {len(words)}")

    processed_data = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                processed_list = json.load(f)
                for item in processed_list:
                    processed_data[item['word']] = item['definition']
            print(f"Уже готово: {len(processed_data)}. Продолжаем...")
        except:
            pass

    words_to_do = [w for w in words if w not in processed_data]
    BATCH_SIZE = 20
    results = []
    
    for w, d in processed_data.items():
        results.append({"word": w, "definition": d, "source": "gemini_ai"})

    print(f"Начинаем генерацию через {model_name}...")

    for i in range(0, len(words_to_do), BATCH_SIZE):
        batch = words_to_do[i:i + BATCH_SIZE]
        words_str = ", ".join(batch)
        
        prompt = f"""
        Ты - словарь. Дай краткие определения для следующих слов в формате JSON:
        {{ "слово": "определение", "слово2": "определение2" }}
        
        Определения должны быть:
        1. На русском языке.
        2. Краткими (1 предложение).
        3. Без слов "это", "является".
        
        Слова: {words_str}
        """

        try:
            response = model.generate_content(prompt)
            # Иногда Gemini возвращает текст с разметкой ```json
            text = response.text
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            
            batch_results = json.loads(text.strip())
            
            for word, definition in batch_results.items():
                print(f"✅ {word}: {definition}")
                results.append({
                    "word": word.lower(),
                    "definition": definition,
                    "source": "gemini_ai"
                })

            # Сохраняем прогресс
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            
            # Небольшая пауза для обхода лимитов
            time.sleep(1)

        except Exception as e:
            print(f"⚠️ Ошибка на пачке {i}: {e}")
            time.sleep(5)

    print(f"\n🎉 Готово! Сохранено в {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_definitions()