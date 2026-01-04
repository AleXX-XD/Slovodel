// Используем проверенный и стабильный источник (Harrix Russian Nouns)
const DICTIONARY_URL = "https://raw.githubusercontent.com/Harrix/Russian-Nouns/master/dist/russian_nouns.txt";

let dictionaryCache: Set<string> | null = null;

export const loadDictionary = async (): Promise<Set<string>> => {
  if (dictionaryCache) return dictionaryCache;

  try {
    // Используем mode: 'cors' и cache: 'default' для надежности
    const response = await fetch(DICTIONARY_URL, {
      method: 'GET',
      headers: { 'Accept': 'text/plain' }
    });
    
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const text = await response.text();
    if (!text || text.length < 100) throw new Error("Received empty or corrupt dictionary");

    // Разбиваем текст по строкам, убираем пустые, переводим в нижний регистр и заменяем ё на е
    const words = text.split(/\r?\n/)
      .map(w => w.trim().toLowerCase().replace(/ё/g, 'е'))
      .filter(w => w.length > 1);
    
    dictionaryCache = new Set(words);
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