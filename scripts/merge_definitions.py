import json
import os

WORDS_FILE = "public/words.txt"
GEMINI_FILE = "gemini_definitions.json"
YANDEX_FILE = "yandex_definitions.json"
OUTPUT_FILE = "public/words.json"

def main():
    print("Reading word list...")
    with open(WORDS_FILE, "r", encoding="utf-8") as f:
        all_words = {line.strip() for line in f if line.strip()}
    
    print(f"Total words in {WORDS_FILE}: {len(all_words)}")

    definitions_map = {}

    # Load Gemini definitions
    if os.path.exists(GEMINI_FILE):
        with open(GEMINI_FILE, "r", encoding="utf-8") as f:
            gemini_data = json.load(f)
            for item in gemini_data:
                word = item["word"]
                if word in all_words:
                    definitions_map[word] = item["definition"]
    
    print(f"Definitions from Gemini: {len(definitions_map)}")

    # Load Yandex definitions
    yandex_count = 0
    if os.path.exists(YANDEX_FILE):
        with open(YANDEX_FILE, "r", encoding="utf-8") as f:
            yandex_data = json.load(f)
            for item in yandex_data:
                word = item["word"]
                if word in all_words and word not in definitions_map:
                    definitions_map[word] = item["definition"]
                    yandex_count += 1
    
    print(f"Definitions from Yandex (new): {yandex_count}")
    print(f"Total definitions: {len(definitions_map)}")

    missing = all_words - set(definitions_map.keys())
    if missing:
        print(f"WARNING: {len(missing)} words are still missing definitions.")
        with open("final_missing_check.txt", "w", encoding="utf-8") as f:
            for w in sorted(list(missing)):
                f.write(w + "\n")
        print("Missing words written to final_missing_check.txt")
    else:
        print("All words covered!")

    # Format for output
    # The user asked for "words.json". Usually this implies a specific structure.
    # Looking at public/dictionary.json (if it exists) or existing usage might help, 
    # but the simplest valid structure is a list of objects or a dict.
    # Based on previous files, it's a list of {word, definition}.
    
    output_data = [
        {"word": word, "definition": definitions_map[word]}
        for word in sorted(list(definitions_map.keys()))
    ]

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully wrote {len(output_data)} definitions to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
