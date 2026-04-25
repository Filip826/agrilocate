import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DEVICE_ID = "krava_1";

const fence = [
  { lat: 48.97702, lon: 20.41976 },
  { lat: 48.98143, lon: 20.42789 },
  { lat: 48.98230, lon: 20.42308 },
  { lat: 48.97474, lon: 20.42607 },
];

function isInsidePolygon(lat: number, lon: number, polygon: any[]) {
  let inside = false;
  let j = polygon.length - 1;

  for (let i = 0; i < polygon.length; i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lon;
    const xj = polygon[j].lat;
    const yj = polygon[j].lon;

    const intersect =
      (yi > lon) !== (yj > lon) &&
      lat < ((xj - xi) * (lon - yi)) / ((yj - yi) || 0.0000001) + xi;

    if (intersect) inside = !inside;
    j = i;
  }

  return inside;
}

serve(async () => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const res = await fetch(`${SUPABASE_URL}/rest/v1/locations?device_id=eq.${DEVICE_ID}&order=created_at.desc&limit=1`, {
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    const data = await res.json();
    if (!data.length) return new Response("No data");

    const latest = data[0];

    let message = "Zariadenie je v poriadku.";

    if (!isInsidePolygon(latest.lat, latest.lon, fence)) {
      message = `❌ Zariadenie je MIMO ohrady (${latest.lat}, ${latest.lon})`;
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: "hodakfilip24@gmail.com",
        subject: "📡 Stav zariadenia",
        html: `<p>${message}</p>`,
      }),
    });

    return new Response("OK");
  } catch (err) {
    return new Response("ERROR", { status: 500 });
  }
});