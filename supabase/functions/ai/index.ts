import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Body = {
  question?: string;
  deviceName?: string;
  deviceId?: string;
  quickContext?: string;
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type LocationRow = {
  lat: number;
  lon: number;
  created_at: string;
  device_id: string | null;
};

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function distMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const dx = a.lat - b.lat;
  const dy = a.lon - b.lon;
  return Math.sqrt(dx * dx + dy * dy) * 111_000;
}

function calcRouteMeters(points: Array<Pick<LocationRow, "lat" | "lon">>) {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += distMeters(points[i - 1], points[i]);
  }
  return sum;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const SK_MONTHS: Record<string, number> = {
  "január": 0, "januar": 0,
  "február": 1, "februar": 1,
  "marec": 2,
  "apríl": 3, "april": 3,
  "máj": 4, "maj": 4,
  "jún": 5, "jun": 5,
  "júl": 6, "jul": 6,
  "august": 7,
  "september": 8,
  "október": 9, "oktober": 9,
  "november": 10,
  "december": 11,
};

function parseTimeRange(questionRaw: string): { from: Date; to: Date; label: string } | null {
  const q = questionRaw.toLowerCase().trim();
  const now = new Date();

  const numericDate = q.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (numericDate) {
    const day = Number(numericDate[1]);
    const month = Number(numericDate[2]) - 1;
    const year = Number(numericDate[3]);
    const from = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const to = new Date(Date.UTC(year, month, day + 1, 0, 0, 0));
    return { from, to, label: `${day}.${month + 1}.${year}` };
  }

  if (q.includes("dnes")) {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return { from, to, label: `dnes (${toISODate(from)})` };
  }

  if (q.includes("včera") || q.includes("vcera")) {
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return { from, to, label: `včera (${toISODate(from)})` };
  }

  const dayMonthYear = q.match(
    /(\d{1,2})\.?\s*(janu[aá]r|febru[aá]r|marec|apr[ií]l|m[aá]j|j[uú]n|j[uú]l|august|september|okt[oó]ber|november|december)\s*(\d{4})/i,
  );
  if (dayMonthYear) {
    const day = Number(dayMonthYear[1]);
    const monthName = dayMonthYear[2].toLowerCase();
    const year = Number(dayMonthYear[3]);
    const m = SK_MONTHS[monthName];
    if (m !== undefined) {
      const from = new Date(Date.UTC(year, m, day, 0, 0, 0));
      const to = new Date(Date.UTC(year, m, day + 1, 0, 0, 0));
      return { from, to, label: `${day}. ${monthName} ${year}` };
    }
  }

  const monthYear = q.match(
    /(janu[aá]r|febru[aá]r|marec|apr[ií]l|m[aá]j|j[uú]n|j[uú]l|august|september|okt[oó]ber|november|december)\s*(\d{4})/i,
  );
  if (monthYear) {
    const monthName = monthYear[1].toLowerCase();
    const year = Number(monthYear[2]);
    const m = SK_MONTHS[monthName];
    if (m !== undefined) {
      const from = new Date(Date.UTC(year, m, 1, 0, 0, 0));
      const to = new Date(Date.UTC(year, m + 1, 1, 0, 0, 0));
      return { from, to, label: `${monthName} ${year}` };
    }
  }

  return null;
}

function isDistanceQuestion(qRaw: string) {
  const q = qRaw.toLowerCase();
  return (
    (q.includes("koľko") && (q.includes("prešlo") || q.includes("preslo"))) ||
    q.includes("vzdialen") ||
    q.includes("posun") ||
    q.includes("prejden")
  );
}

function isLastLocationQuestion(qRaw: string) {
  const q = qRaw.toLowerCase();
  return (
    q.includes("kde je") ||
    q.includes("posledn") ||
    q.includes("poloha") ||
    q.includes("aktuál") ||
    q.includes("aktual")
  );
}

function makeSupabaseClient(req: Request) {
  if (!SUPABASE_URL) {
    throw new Error("Chýba SUPABASE_URL");
  }

  const auth = req.headers.get("Authorization") ?? "";

  if (auth && SUPABASE_ANON_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
  }

  if (SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }

  if (SUPABASE_ANON_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  throw new Error("Chýba SUPABASE_ANON_KEY alebo SUPABASE_SERVICE_ROLE_KEY");
}

async function fetchLocationsForRange(
  supabase: ReturnType<typeof createClient>,
  deviceId: string,
  from: Date,
  to: Date,
) {
  const { data, error } = await supabase
    .from("locations")
    .select("lat, lon, created_at, device_id")
    .eq("device_id", deviceId)
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LocationRow[];
}

async function fetchLatestLocation(
  supabase: ReturnType<typeof createClient>,
  deviceId: string,
) {
  const { data, error } = await supabase
    .from("locations")
    .select("lat, lon, created_at, device_id")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data?.[0] ?? null) as LocationRow | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Use POST" }, 405);
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse({ answer: "Invalid JSON body" }, 400);
  }

  const question = (body.question ?? "").trim();
  const deviceName = (body.deviceName ?? "zariadenie").trim() || "zariadenie";
  const deviceId = (body.deviceId ?? "").trim();
  const quickContext = (body.quickContext ?? "").trim();

  if (!question) {
    return jsonResponse({ answer: `Ahoj ${deviceName}!` }, 200);
  }

  let supabase;
  try {
    supabase = makeSupabaseClient(req);
  } catch (e) {
    return jsonResponse({ answer: `Chyba konfigurácie Supabase: ${(e as Error).message}` }, 500);
  }

  if (deviceId && isDistanceQuestion(question)) {
    const range = parseTimeRange(question);
    if (!range) {
      return jsonResponse({
        answer:
          "Chceš vzdialenosť, ale neviem čas. Skús: „koľko prešlo dnes“, „koľko prešlo včera“, „koľko prešlo 2.3.2026“, „koľko prešlo február 2026“.",
      });
    }

    try {
      const pts = await fetchLocationsForRange(supabase, deviceId, range.from, range.to);
      if (pts.length < 2) {
        return jsonResponse({
          answer: `Nemám dosť bodov pre ${range.label}. Body: ${pts.length}`,
          db_used: true,
        });
      }

      const meters = calcRouteMeters(pts);
      return jsonResponse({
        answer: `Za ${range.label} prešlo ${deviceName} približne ${Math.round(meters)} m (${(meters / 1000).toFixed(2)} km).`,
        db_used: true,
      });
    } catch (e) {
      return jsonResponse({ answer: `Chyba DB: ${(e as Error)?.message ?? String(e)}` }, 500);
    }
  }

  if (deviceId && isLastLocationQuestion(question)) {
    try {
      const last = await fetchLatestLocation(supabase, deviceId);
      if (!last) {
        return jsonResponse({ answer: `Nemám žiadne body pre ${deviceName}.`, db_used: true });
      }

      return jsonResponse({
        answer: `Posledná poloha ${deviceName}: ${last.lat.toFixed(6)}, ${last.lon.toFixed(6)} (čas: ${last.created_at}).`,
        db_used: true,
      });
    } catch (e) {
      return jsonResponse({ answer: `Chyba DB: ${(e as Error)?.message ?? String(e)}` }, 500);
    }
  }

  if (!OPENAI_API_KEY) {
    return jsonResponse({ answer: "Chýba OPENAI_API_KEY v Supabase secrets." }, 500);
  }

  const systemPrompt =
    "Si AI asistent pre poľnohospodárstvo a chov zvierat.\n" +
    "Odpovedaj po slovensky.\n" +
    "Dávaj praktické rady (kŕmenie, prevencia, choroby, hygiena, sezóna).\n" +
    "Pri zdravotných problémoch zvierat odporuč veterinára.\n";

  const userPrompt =
    `Kontext od klienta: ${quickContext || "—"}\n` +
    `Zariadenie: ${deviceName} (deviceId=${deviceId || "—"})\n\n` +
    `Otázka:\n${question}`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 700,
      }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return jsonResponse({ answer: `OpenAI chyba: ${r.status} ${t}` }, 500);
    }

    const json = await r.json();
    return jsonResponse({ answer: json?.choices?.[0]?.message?.content ?? "Bez odpovede." }, 200);
  } catch (e) {
    return jsonResponse({ answer: `Chyba pri volaní OpenAI: ${(e as Error)?.message ?? String(e)}` }, 500);
  }
});