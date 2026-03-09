import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type LocationPoint = {
  lat: number;
  lon: number;
  created_at: string;
  device_id?: string | null;
};

type Msg = { role: 'user' | 'ai'; text: string };

interface Props {
  onClose: () => void;

  // vybrané zariadenie
  deviceId: string;
  deviceName: string;

  // ak je fake zariadenie, DB otázky nemajú historické dáta
  isFakeDevice?: boolean;

  // posledné body (len pre rýchly kontext v chate)
  locations?: LocationPoint[];
}

/* ================= helpers ================= */

function distMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const dx = a.lat - b.lat;
  const dy = a.lon - b.lon;
  return Math.sqrt(dx * dx + dy * dy) * 111_000;
}

function calcRouteMeters(points: LocationPoint[]) {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += distMeters(points[i - 1], points[i]);
  return sum;
}

function lastPoint(points: LocationPoint[]) {
  if (!points?.length) return null;
  return [...points].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Slovak month names -> month index
const SK_MONTHS: Record<string, number> = {
  január: 0, januar: 0,
  február: 1, februar: 1,
  marec: 2,
  apríl: 3, april: 3,
  máj: 4, maj: 4,
  jún: 5, jun: 5,
  júl: 6, jul: 6,
  august: 7,
  september: 8,
  október: 9, oktober: 9,
  november: 10,
  december: 11,
};

function parseTimeRange(questionRaw: string): { from: Date; to: Date; label: string } | null {
  const q = questionRaw.toLowerCase().trim();
  const now = new Date();

  // 1) numerický dátum: 2.3.2026 alebo 02.03.2026
  const numericDate = q.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (numericDate) {
    const day = Number(numericDate[1]);
    const month = Number(numericDate[2]) - 1;
    const year = Number(numericDate[3]);
    const from = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const to = new Date(Date.UTC(year, month, day + 1, 0, 0, 0));
    return { from, to, label: `${day}.${month + 1}.${year}` };
  }

  // dnes
  if (q.includes('dnes')) {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return { from, to, label: `dnes (${toISODate(from)})` };
  }

  // včera
  if (q.includes('včera') || q.includes('vcera')) {
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return { from, to, label: `včera (${toISODate(from)})` };
  }

  // konkrétny deň: 3 februára 2026
  const dayMonthYear = q.match(
    /(\d{1,2})\.?\s*(janu[aá]r|febru[aá]r|marec|apr[ií]l|m[aá]j|j[uú]n|j[uú]l|august|september|okt[oó]ber|november|december)\s*(\d{4})/i
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

  // mesiac + rok: február 2026
  const monthYear = q.match(
    /(janu[aá]r|febru[aá]r|marec|apr[ií]l|m[aá]j|j[uú]n|j[uú]l|august|september|okt[oó]ber|november|december)\s*(\d{4})/i
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
    (q.includes('koľko') && (q.includes('prešlo') || q.includes('preslo'))) ||
    q.includes('vzdialen') ||
    q.includes('posun') ||
    q.includes('prejden')
  );
}

/* ================= AI endpoint call ================= */

async function askAgriAI(params: {
  question: string;
  deviceName: string;
  quickContext?: string;
}) {
  const endpoint = (import.meta.env.VITE_AI_ENDPOINT as string | undefined) ?? '';

  if (!endpoint) {
    return (
      'Nemám nastavený AI endpoint.\n' +
      'Do .env daj VITE_AI_ENDPOINT=https://<project-ref>.functions.supabase.co/ai a reštartni npm run dev.'
    );
  }

  // ak je user prihlásený, pošli JWT => vyrieši 401 Unauthorized
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      question: params.question,
      deviceName: params.deviceName,
      quickContext: params.quickContext ?? '',
    }),
  });

  // Failed to fetch = väčšinou CORS/URL/offline
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    return `AI endpoint vrátil chybu (${res.status}). ${t ? `Detail: ${t}` : 'Skontroluj logy funkcie.'}`;
  }

  const json = await res.json();
  return String(json.answer ?? 'AI nevrátil odpoveď.');
}

/* ================= DB query for distance =================
   predpoklad: tabuľka locations obsahuje lat, lon, created_at a ideálne device_id
*/
async function fetchLocationsForRange(deviceId: string, from: Date, to: Date) {
  // Skús s device_id filtrom
  const q = supabase
    .from('locations')
    .select('lat, lon, created_at, device_id')
    .gte('created_at', from.toISOString())
    .lt('created_at', to.toISOString())
    .order('created_at', { ascending: true });

  const { data, error } = await q.eq('device_id', deviceId as any);

  if (!error) {
    return (data ?? []).map((r: any) => ({
      lat: Number(r.lat),
      lon: Number(r.lon),
      created_at: String(r.created_at),
      device_id: r.device_id ?? null,
    })) as LocationPoint[];
  }

  // fallback bez device_id (ak stĺpec v DB nemáš)
  const { data: data2, error: error2 } = await supabase
    .from('locations')
    .select('lat, lon, created_at')
    .gte('created_at', from.toISOString())
    .lt('created_at', to.toISOString())
    .order('created_at', { ascending: true });

  if (error2) throw error2;

  return (data2 ?? []).map((r: any) => ({
    lat: Number(r.lat),
    lon: Number(r.lon),
    created_at: String(r.created_at),
  })) as LocationPoint[];
}

export function AIAssistant({
  onClose,
  deviceId,
  deviceName,
  isFakeDevice,
  locations = [],
}: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'ai',
      text:
        `AI asistent je pripravený.\n\n` +
        `Vie odpovedať:\n` +
        `• “koľko prešlo dnes / včera / február 2026 / 3. februára 2026 / 2.3.2026”\n` +
        `• otázky o poľnohospodárstve (choroby, kŕmenie, prevencia…)`,
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const quickContext = useMemo(() => {
    const last = lastPoint(locations);
    if (!last) return '';
    const todayISO = new Date().toISOString().slice(0, 10);
    const todayPts = locations.filter((l) => String(l.created_at).startsWith(todayISO));
    const todayM = calcRouteMeters(todayPts);
    return `Zariadenie=${deviceName}. Posledná poloha=${last.lat.toFixed(6)},${last.lon.toFixed(6)}. Dnes=${Math.round(todayM)}m.`;
  }, [locations, deviceName]);

  const push = (m: Msg) => setMessages((prev) => [...prev, m]);

  const handleAsk = async (question: string) => {
    const q = question.trim();
    if (!q) return;

    push({ role: 'user', text: q });
    setBusy(true);

    try {
      // 1) GPS analytika
      if (isDistanceQuestion(q)) {
        if (isFakeDevice) {
          push({
            role: 'ai',
            text:
              `${deviceName} je fake zariadenie (nemá historické dáta v databáze), preto neviem presne vypočítať vzdialenosť za vybrané obdobie.`,
          });
          return;
        }

        const range = parseTimeRange(q);
        if (!range) {
          push({
            role: 'ai',
            text:
              `Rozumiem, že chceš vzdialenosť, ale neviem z otázky vyčítať čas.\n` +
              `Skús: “koľko prešlo 2.3.2026”, “koľko prešlo február 2026”, “koľko prešlo dnes”.`,
          });
          return;
        }

        const pts = await fetchLocationsForRange(deviceId, range.from, range.to);

        if (pts.length < 2) {
          push({
            role: 'ai',
            text: `Pre ${deviceName} nemám dosť GPS bodov pre obdobie: ${range.label}. Body: ${pts.length}`,
          });
          return;
        }

        const meters = calcRouteMeters(pts);
        push({
          role: 'ai',
          text:
            `Za obdobie **${range.label}** prešlo ${deviceName} približne **${Math.round(meters)} m** ` +
            `(${(meters / 1000).toFixed(2)} km).`,
        });
        return;
      }

      // 2) Poľnohospodárske otázky -> endpoint
      const agriAnswer = await askAgriAI({
        question: q,
        deviceName,
        quickContext,
      });

      push({ role: 'ai', text: agriAnswer });
    } catch (e: any) {
      push({ role: 'ai', text: `Chyba: ${e?.message ?? String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl w-[620px] max-w-full p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">AI Asistent</h2>
          <p className="text-xs text-gray-500">Zariadenie: {deviceName}</p>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-black">
          ✕
        </button>
      </div>

      <div className="h-[320px] overflow-y-auto border rounded-xl p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={
                m.role === 'user'
                  ? 'inline-block bg-green-600 text-white px-3 py-2 rounded-xl max-w-[85%]'
                  : 'inline-block bg-gray-200 px-3 py-2 rounded-xl max-w-[85%] whitespace-pre-line'
              }
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={busy}
          onClick={() => handleAsk('Koľko prešlo dnes?')}
          className="bg-gray-100 hover:bg-gray-200 py-2 rounded-lg disabled:opacity-50"
        >
          📏 Dnes (vzdialenosť)
        </button>

        <button
          disabled={busy}
          onClick={() => handleAsk('Koľko prešlo včera?')}
          className="bg-gray-100 hover:bg-gray-200 py-2 rounded-lg disabled:opacity-50"
        >
          📈 Včera (vzdialenosť)
        </button>

        <button
          disabled={busy}
          onClick={() => handleAsk('Koľko prešlo 2.3.2026?')}
          className="bg-gray-100 hover:bg-gray-200 py-2 rounded-lg disabled:opacity-50"
        >
          📅 2.3.2026
        </button>

        <button
          disabled={busy}
          onClick={() => handleAsk('Aké choroby sa často šíria medzi dobytkom na jar?')}
          className="bg-gray-100 hover:bg-gray-200 py-2 rounded-lg disabled:opacity-50"
        >
          🐄 Choroby dobytka
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Pýtaj sa: "koľko prešlo 2.3.2026" alebo "čo má jesť dobytok"...'
          className="flex-1 border rounded-lg px-4 py-2"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !busy) {
              handleAsk(input);
              setInput('');
            }
          }}
        />
        <button
          disabled={busy}
          onClick={() => {
            handleAsk(input);
            setInput('');
          }}
          className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {busy ? '...' : 'Poslať'}
        </button>
      </div>
    </div>
  );
}