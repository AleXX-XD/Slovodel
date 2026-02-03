import os
import re
import json

# Входные файлы
WORDS_FILE = os.path.join("public", "words.txt")
AI_FILE = "gemini_definitions.json"
OZHEGOV_FILE = "ozhegov.txt"

# Выходные файлы
OUTPUT_JSON = os.path.join("public", "dictionary.json")
OUTPUT_MISSING = "final_missing.txt"

def clean_definition(text):
    if not text:
        return ""
    
    # 1. Убираем содержимое в квадратных скобках [любой текст]
    text = re.sub(r'\[.*?\]', '', text)
    
    # 2. Убираем пометки в круглых скобках типа (<= слово) или (см. слово)
    # Используем более широкий охват символов внутри скобок
    text = re.sub(r'\(\s*[<>=]+\s*[^)]+\)', '', text)
    
    # 3. Убираем спец-теги и пометки
    noise = [
        'Lib', 'Spec', 'Obs', 'Colloq', 'Poet', 'Non-st', 'Pejor', 'Arch', 'Dial', 
        r'N\d+', 'Maxime', 'Iron', 'Jest', 'Deprec', 'Poet', 'стар', 'разг', 'прост', 'книжн'
    ]
    pattern = r'\b(' + '|'.join(noise) + r')\b[.,]?'
    text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # 4. Если в начале осталось что-то вроде "<= слово", это значит ссылка не разрешилась
    # Убираем эти символы из текста, если они остались внутри
    text = re.sub(r'[<>=]{1,2}\s+', '', text)

    # 5. Убираем лишние пробелы и знаки препинания в конце/начале
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.strip('., ')
    
    return text

def build_dictionary():
    print("🚀 Начинаем сборку локального словаря...")

    # 1. Загружаем список игровых слов
    if not os.path.exists(WORDS_FILE):
        print(f"❌ Нет файла {WORDS_FILE}")
        return

    with open(WORDS_FILE, 'r', encoding='utf-8') as f:
        # Используем set для быстрого поиска, но сохраним порядок если нужно
        game_words = sorted(list(set(line.strip().lower() for line in f if line.strip())))
    
    print(f"📚 Игровых слов: {len(game_words)}")

    # 2. Загружаем определения от ИИ (Gemini)
    ai_defs = {}
    if os.path.exists(AI_FILE):
        with open(AI_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for item in data:
                ai_defs[item['word'].lower()] = item['definition']
    print(f"🤖 Определений от ИИ: {len(ai_defs)}")

    # 3. Загружаем Ожегова (ВСЕ значения с учетом омонимов)
    ozhegov_defs = {}
    if os.path.exists(OZHEGOV_FILE):
        with open(OZHEGOV_FILE, 'r', encoding='utf-8') as f:
            f.readline() # Header
            for line in f:
                parts = line.split('|')
                if len(parts) >= 6:
                    w = parts[0].strip().lower()
                    homonym_id = parts[1].strip() # Номер омонима
                    d = parts[5].strip()
                    if w and d and len(d) > 1:
                        if w not in ozhegov_defs:
                            ozhegov_defs[w] = []
                        ozhegov_defs[w].append((homonym_id, d))
    
    print(f"📖 Словарь Ожегова: {len(ozhegov_defs)} слов (с вариантами)")

    def resolve_reference(text, visited=None):
        """
        Разрешает ссылки вида '== слово', '= слово', '<= слово'.
        """
        if not text:
            return text
            
        # Проверяем, является ли ВСЕ определение ссылкой
        # Учитываем варианты: ==, =, <=
        match = re.match(r'^(?:[<>=]{1,2})\s*([а-яё-]+)(?:\s+(\d+))?$', text.strip(), re.IGNORECASE)
        
        if match:
            if visited is None:
                visited = set()
                
            ref_word = match.group(1).lower()
            ref_id = match.group(2)

            if ref_word in visited:
                return text
            
            visited.add(ref_word)

            if ref_word in ozhegov_defs:
                defs = ozhegov_defs[ref_word]
                if ref_id:
                    for hid, definition in defs:
                        if hid == ref_id:
                            return resolve_reference(definition, visited)
                
                # Если не нашли по ID или ID не указан, берем первое
                return resolve_reference(defs[0][1], visited)
        
        return text

    # 4. Собираем итоговый словарь
    final_dict = {}
    missing_count = 0
    missing_words = []

    for word in game_words:
        definition = None
        
        # Приоритет 1: ИИ (он точнее для игры)
        if word in ai_defs:
            definition = ai_defs[word]
        
        # Приоритет 2: Ожегов
        elif word in ozhegov_defs:
            # Берем первое попавшееся определение (обычно основное значение)
            # Структура: [(id, def), (id, def)...]
            raw_def = ozhegov_defs[word][0][1]
            definition = resolve_reference(raw_def)
            
        # Приоритет 3: Ожегов (попытка найти множественное число)
        elif not definition:
             variants = []
             if word.endswith("а"): variants.append(word[:-1] + "ы") # бутса -> бутсы
             if word.endswith("я"): variants.append(word[:-1] + "и") # вишня -> вишни
             if word.endswith("ь"): variants.append(word[:-1] + "и") # дверь -> двери
             if word.endswith("ы"): variants.append(word[:-1])      # столы -> стол
             if word.endswith("и"): variants.append(word[:-1])      # люди -> люд? нет
             
             for v in variants:
                 if v in ozhegov_defs:
                     found_def = ozhegov_defs[v][0][1]
                     definition = f"({v.upper()}) {resolve_reference(found_def)}"
                     break

        if definition:
            final_dict[word] = clean_definition(definition)
        else:
            missing_count += 1
            missing_words.append(word)

    # 5. Сохраняем результат
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(final_dict, f, ensure_ascii=False, indent=2) # Компактный JSON, но с отступами
    
    print(f"\n💾 Словарь сохранен в: {OUTPUT_JSON}")
    print(f"✅ Успешно определено: {len(final_dict)} слов")
    print(f"⚠️ Отсутствует: {missing_count} слов")

    # Сохраняем список отсутствующих для доработки ИИ
    if missing_words:
        with open(OUTPUT_MISSING, 'w', encoding='utf-8') as f:
            f.write("\n".join(missing_words))
        print(f"📝 Список отсутствующих сохранен в {OUTPUT_MISSING} (можно скормить Gemini)")

if __name__ == "__main__":
    build_dictionary()
