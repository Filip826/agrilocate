import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : null;

    const gpsSummary =
      typeof body?.gps_summary === "string" &&
      body.gps_summary.trim().length > 0
        ? body.gps_summary.trim()
        : null;

    if (!message) {
      return new Response(
        JSON.stringify({ reply: "❌ Prázdna správa" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* =======================
       🧠 SYSTEM PROMPT
    ======================= */

    const systemPrompt = `
Si inteligentný AI asistent pre farmára.

Máš dve úlohy:

1️⃣ Ak sa otázka týka POHYBU, AKTIVITY, POLOHY alebo GPS:
- Použi GPS fakty, AK SÚ POSKYTNUTÉ
- Nehádaj, nevymýšľaj

2️⃣ Ak sa otázka NETÝKA GPS (napr. chov, teľnosť, výživa, zima, starostlivosť):
- Odpovedaj normálne podľa všeobecných farmárskych vedomostí
- Nehovor, že „nemáš informácie“, ak ide o bežnú otázku

Vždy odpovedaj:
- po slovensky
- vecne
- zrozumiteľne
`;

    const userPrompt = gpsSummary
      ? `
FAKTY Z GPS (AK SÚ POTREBNÉ):
${gpsSummary}

OTÁZKA POUŽÍVATEĽA:
${message}
`
      : message;

    /* =======================
       🤖 OPENAI
    ======================= */

    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
        }),
      }
    );

    const data = await openaiRes.json();

    const reply =
      data?.choices?.[0]?.message?.content ??
      "❌ AI neodpovedala.";

    return new Response(
      JSON.stringify({ reply }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("AI CHAT ERROR:", err);
    return new Response(
      JSON.stringify({ reply: "❌ Server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
