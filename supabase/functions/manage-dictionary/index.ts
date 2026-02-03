import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, word, id, definition: manualDefinition } = await req.json();

    // 1. ADD WORD (with auto-definition)
    if (action === 'add' && word) {
      const cleanWord = word.trim().toLowerCase();

      // Check if exists
      const { data: existing } = await supabaseClient
        .from('definitions')
        .select('id')
        .eq('word', cleanWord)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ success: false, error: 'Слово уже существует' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let definition = manualDefinition;

      // If no manual definition provided, fetch from Yandex
      if (!definition) {
        const yandexFolderId = Deno.env.get('YANDEX_FOLDER_ID');
        const yandexApiKey = Deno.env.get('YANDEX_API_KEY');

        if (yandexFolderId && yandexApiKey) {
          try {
            const prompt = {
              "modelUri": `gpt://${yandexFolderId}/yandexgpt-lite/latest`,
              "completionOptions": {
                "stream": false,
                "temperature": 0.3,
                "maxTokens": 100
              },
              "messages": [
                {
                  "role": "system",
                  "text": "Ты — толковый словарь. Дай краткое определение слову в именительном падеже. Без вводных слов."
                },
                {
                  "role": "user",
                  "text": `Определение слова: ${cleanWord}`
                }
              ]
            };

            const yaRes = await fetch("https://llm.api.cloud.yandex.net/foundationModels/v1/completion", {
              method: 'POST',
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Api-Key ${yandexApiKey}`
              },
              body: JSON.stringify(prompt)
            });

            if (yaRes.ok) {
              const yaData = await yaRes.json();
              definition = yaData.result?.alternatives?.[0]?.message?.text?.trim();
            } else {
               console.error('Yandex API Error:', await yaRes.text());
            }
          } catch (e) {
            console.error('Yandex Fetch Error:', e);
          }
        }
      }

      // Fallback if Yandex fails
      if (!definition) {
        definition = "Определение отсутствует (добавлено вручную)";
      }

      // Insert into DB
      const { error: insertError } = await supabaseClient
        .from('definitions')
        .insert({
            word: cleanWord,
            definition: definition,
            source: 'admin_panel'
        });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true, word: cleanWord, definition }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
