import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { text } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",

        // 🔴 TU SI NATRVALO NASTAV EMAIL
        to: "hodakfilip24@gmail.com",

        subject: "📡 Stav zariadenia",
        html: `<p>${text}</p>`,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Chyba pri odosielaní emailu" }),
      { status: 500 }
    );
  }
});