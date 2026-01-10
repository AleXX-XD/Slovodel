// Используем проверенный источник (Harrix Russian Nouns).
// Чтобы добавить больше слов, создайте файл words.txt в папке public и добавьте сюда строку "./words.txt"
const DICTIONARY_URLS = [
  "./words.txt"
];

let dictionaryCache: Set<string> | null = null;

export const loadDictionary = async (): Promise<Set<string>> => {
  if (dictionaryCache) return dictionaryCache;

  try {
    // Загружаем все словари параллельно
    const promises = DICTIONARY_URLS.map(url => 
      fetch(url).then(res => {
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        return res.text();
      }).catch(e => {
        console.warn(`Ошибка загрузки словаря ${url}:`, e);
        return ""; // Если один словарь упал, продолжаем с другими
      })
    );

    const texts = await Promise.all(promises);
    const combinedText = texts.join('\n');

    if (!combinedText || combinedText.length < 100) throw new Error("Все словари недоступны");

    // Разбиваем, чистим, фильтруем (оставляем только кириллицу)
    const words = combinedText.split(/\r?\n/)
      .map(w => w.trim().toLowerCase().replace(/ё/g, 'е'))
      .filter(w => w.length > 1 && /^[а-я]+(-[а-я]+)*$/.test(w));
    
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