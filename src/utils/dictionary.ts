// Используем легкий файл words_list.json (только слова)
const DICTIONARY_URL = "/data/words_list.json";

let dictionaryCache: Set<string> | null = null;

export const loadDictionary = async (forceReload = false): Promise<Set<string>> => {
  if (dictionaryCache && !forceReload) return dictionaryCache;

  try {
    // Добавляем timestamp для обхода кэша
    const response = await fetch(`${DICTIONARY_URL}?t=${Date.now()}`);
    if (!response.ok) throw new Error(`Failed to load ${DICTIONARY_URL}`);

    const data: string[] = await response.json();
    
    if (!Array.isArray(data)) throw new Error("Invalid dictionary format");

    const words = new Set<string>();

    data.forEach((rawWord) => {
      if (typeof rawWord === 'string') {
        const cleanWord = rawWord.trim().toLowerCase().replace(/ё/g, 'е');
        if (cleanWord.length > 1 && /^[а-я]+(-[а-я]+)*$/.test(cleanWord)) {
          words.add(cleanWord);
        }
      }
    });
    
    dictionaryCache = words;
    console.log(`Словарь успешно загружен: ${dictionaryCache.size} слов`);
    return dictionaryCache;
  } catch (error) {
    console.error("Ошибка при загрузке внешнего словаря:", error);
    // Фолбэк на расширенный базовый набор, если сеть недоступна
    const fallbackWords = [
      "дом", "кот", "лес", "игра", "слово", "окно", "мама", "арбуз", "банан", "город", "река", 
      "стол", "стул", "хлеб", "вода", "небо", "море", "гора", "друг", "рука", "нога", "лицо",
      "карта", "книга", "ручка", "лампа", "стена", "дверь", "ключ", "замок", "поезд", "самолет"
    ];
    dictionaryCache = new Set(fallbackWords);
    return dictionaryCache;
  }
};

export const getDictionary = () => dictionaryCache;

// Устарело: Определения теперь загружаются через API асинхронно
export const getDefinition = (_word: string): string | null => {
  return null;
};