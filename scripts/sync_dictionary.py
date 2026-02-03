import os
import json
import time
from supabase import create_client, Client

# Конфигурация
URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key to bypass RLS if needed, or Anon key
WORDS_JSON = os.path.join("public", "words.json")

def main():
    if not URL or not KEY:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in env.")
        return

    print("🚀 Connecting to Supabase...")
    supabase: Client = create_client(URL, KEY)

    # 1. Fetch all definitions
    print("📥 Fetching definitions from DB...")
    
    # Supabase limits fetch to 1000 by default, need pagination for 50k+ words
    all_definitions = []
    offset = 0
    limit = 1000
    
    while True:
        response = supabase.table('definitions').select('*').range(offset, offset + limit - 1).execute()
        data = response.data
        if not data:
            break
        
        all_definitions.extend(data)
        print(f"   Fetched {len(all_definitions)} words...", end='\r')
        
        if len(data) < limit:
            break
        offset += limit

    print(f"\n✅ Total words fetched: {len(all_definitions)}")

    # 2. Format as words.json structure
    # Expected: [{ "word": "...", "definition": "..." }, ...]
    # We prioritize DB definitions.
    
    output_data = []
    # Sort by word
    all_definitions.sort(key=lambda x: x['word'])
    
    for item in all_definitions:
        output_data.append({
            "word": item['word'],
            "definition": item['definition']
        })

    # 3. Write to file
    print(f"💾 Saving to {WORDS_JSON}...")
    with open(WORDS_JSON, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print("🎉 Done! public/words.json is now in sync with Supabase.")

if __name__ == "__main__":
    main()
