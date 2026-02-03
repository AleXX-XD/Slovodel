import os
import json

# Пути к файлам
GAME_WORDS_FILE = os.path.join("public", "words.txt")
DICT_FILE = "ozhegov.txt"
OUTPUT_FIXES = "fixes.json"
OUTPUT_MISSING = "missing.txt"

def audit_dictionary():
    # 1. Загружаем игровые слова
    print(f"1. Читаем игровые слова из {GAME_WORDS_FILE}...")
    if not os.path.exists(GAME_WORDS_FILE):
        print(f"❌ Файл {GAME_WORDS_FILE} не найден! Создайте его или укажите правильный путь.")
        # Создадим заглушку для теста, если файла нет
        return

    with open(GAME_WORDS_FILE, 'r', encoding='utf-8') as f:
        game_words = set(line.strip().lower() for line in f if line.strip())
    
    print(f"   Найдено игровых слов: {len(game_words)}")

    # 2. Загружаем словарь Ожегова в память
    print(f"2. Читаем справочник {DICT_FILE}...")
    ozhegov_dict = {}
    
    if not os.path.exists(DICT_FILE):
        print(f"❌ Файл {DICT_FILE} не найден.")
        return

    with open(DICT_FILE, 'r', encoding='utf-8') as f:
        f.readline() # Пропуск заголовка
        for line in f:
            parts = line.split('|')
            if len(parts) >= 6:
                word = parts[0].strip().lower()
                definition = parts[5].strip()
                if word and definition:
                    ozhegov_dict[word] = definition

    print(f"   Найдено словарных статей: {len(ozhegov_dict)}")

    # 3. Сравниваем
    print("3. Сравниваем списки...")
    missing_in_dict = []
    
    for word in game_words:
        if word not in ozhegov_dict:
            missing_in_dict.append(word)

    print(f"   Слов из игры, которых нет в справочнике: {len(missing_in_dict)}")

    # 4. Пробуем найти замены (авто-фикс)
    print("4. Генерируем исправления...")
    
    fixes = []
    still_missing = []

    # Эвристика для русского языка (простая)
    # Пытаемся превратить "бутса" (ед.ч) в "бутсы" (мн.ч)
    endings = {
        "": ["ы", "и", "а", "я"],       # стол -> столы
        "а": ["ы", "и", ""],            # бутса -> бутсы
        "я": ["и", "й", ""],
        "ь": ["и", "ей"],
        "й": ["и", "я"]
    }

    for word in missing_in_dict:
        found_match = None
        match_source = ""

        # Пробуем разные варианты окончаний
        last_char = word[-1:]
        stem = word[:-1]
        
        possible_forms = []
        
        # 1. Добавление окончания (стол -> столы)
        possible_forms.append(word + "ы")
        possible_forms.append(word + "и")
        
        # 2. Замена окончания (бутса -> бутсы)
        possible_forms.append(stem + "ы")
        possible_forms.append(stem + "и")
        possible_forms.append(stem + "а")
        
        # 3. Мягкий знак (день -> дни)
        possible_forms.append(stem + "ь")
        
        for form in possible_forms:
            if form in ozhegov_dict:
                found_match = ozhegov_dict[form]
                match_source = form
                break
        
        if found_match:
            # Создаем новую запись: Игровое слово -> Определение найденной формы
            prefix = f"({match_source.upper()}) "
            fixes.append({
                "word": word,
                "definition": prefix + found_match,
                "source": "autofix_plural"
            })
        else:
            still_missing.append(word)

    # 5. Сохраняем результаты
    print(f"   Удалось автоматически восстановить: {len(fixes)}")
    print(f"   Осталось без определения: {len(still_missing)}")

    if fixes:
        with open(OUTPUT_FIXES, 'w', encoding='utf-8') as f:
            json.dump(fixes, f, ensure_ascii=False, indent=2)
        print(f"✅ Файл исправлений сохранен: {OUTPUT_FIXES} (Загрузите его в базу!)")

    if still_missing:
        with open(OUTPUT_MISSING, 'w', encoding='utf-8') as f:
            f.write("\n".join(sorted(still_missing)))
        print(f"⚠️ Список отсутствующих слов сохранен: {OUTPUT_MISSING}")

if __name__ == "__main__":
    audit_dictionary()
