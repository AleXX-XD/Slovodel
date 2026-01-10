// supabase/functions/telegram-bot/index.ts

// Логика перенесена на Python-бэкенд. Эта функция отключена.
Deno.serve(async (req) => {
  return new Response(JSON.stringify({ message: "Function disabled" }), { 
    headers: { "Content-Type": "application/json" } 
  })
})

