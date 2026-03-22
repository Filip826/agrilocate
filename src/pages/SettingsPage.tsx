import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Siren } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type AppNotification = {
  id: string;
  type: 'success' | 'warning' | 'error';
  text: string;
  createdAt: string;
};

type LocationRow = {
  id: string;
  device_id: string;
  lat: number;
  lon: number;
  created_at: string;
};

// 🔥 TU DAJ SVOJU URL
const SUPABASE_FUNCTION_URL = "https://qsdcgqllaaovuhicoqiw.supabase.co/functions/v1/send-email";

// Virtuálna ohrada
const fence = [
  { lat: 48.97702, lon: 20.41976 },
  { lat: 48.98143, lon: 20.42789 },
  { lat: 48.98230, lon: 20.42308 },
  { lat: 48.97474, lon: 20.42607 },
];

const DEVICE_ID = 'krava_1';
const STILL_HOURS = 10;
const STILL_DISTANCE_M = 5;

function toRad(v: number) {
  return (v * Math.PI) / 180;
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isInsidePolygon(lat: number, lon: number, polygon: { lat: number; lon: number }[]) {
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

function sameHour(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours()
  );
}

export function SettingsPage() {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<'ok' | 'outside' | 'still' | 'unknown'>('unknown');
  const [lastChecked, setLastChecked] = useState<string>('');
  const [lastLocation, setLastLocation] = useState<LocationRow | null>(null);

  const lastHourlyRef = useRef<Date | null>(null);
  const lastOutsideRef = useRef<string>('');
  const lastStillRef = useRef<string>('');

  const sendEmail = async (text: string) => {
    try {
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      console.log("EMAIL RESPONSE:", data);
    } catch (err) {
      console.error('Chyba pri odosielaní emailu:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const pushNotification = (
      type: AppNotification['type'],
      text: string,
      dedupeKey?: string,
      coords?: { lat: number; lon: number }
    ) => {
      if (!mounted) return;

      if (type === 'error' && dedupeKey && lastOutsideRef.current === dedupeKey) return;
      if (type === 'warning' && dedupeKey && lastStillRef.current === dedupeKey) return;

      if (type === 'error' && dedupeKey) lastOutsideRef.current = dedupeKey;
      if (type === 'warning' && dedupeKey) lastStillRef.current = dedupeKey;

      const fullText = coords
        ? `${text} (Lat: ${coords.lat.toFixed(6)}, Lon: ${coords.lon.toFixed(6)})`
        : text;

      setNotifications(prev => [
        {
          id: crypto.randomUUID(),
          type,
          text: fullText,
          createdAt: new Date().toISOString(),
        },
        ...prev.slice(0, 25),
      ]);

      // 🔥 Odosielame email len pre outside / still a success raz za hodinu
      if (type === 'error' || type === 'warning' || type === 'success') {
        sendEmail(fullText);
      }
    };

    const checkDeviceStatus = async () => {
      try {
        const now = new Date();
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('device_id', DEVICE_ID)
          .order('created_at', { ascending: false })
          .limit(300);

        if (error) {
          console.error('Chyba pri načítaní locations:', error.message);
          return;
        }

        const rows = (data ?? []) as LocationRow[];

        if (rows.length === 0) {
          if (mounted) {
            setCurrentStatus('unknown');
            setLastChecked(now.toISOString());
            setLoading(false);
          }
          return;
        }

        const latest = rows[0];

        if (mounted) {
          setLastLocation(latest);
          setLastChecked(now.toISOString());
        }

        let status: 'ok' | 'outside' | 'still' | 'unknown' = 'ok';

        // Kontrola inside/outside
        if (latest.lat != null && latest.lon != null) {
          const inside = isInsidePolygon(Number(latest.lat), Number(latest.lon), fence);
          if (!inside) {
            status = 'outside';
            const outsideKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-outside`;
            pushNotification(
              'error',
              'Zariadenie je von z ohrady.',
              outsideKey,
              { lat: Number(latest.lat), lon: Number(latest.lon) }
            );
          }
        }

        // Kontrola still
        if (status !== 'outside' && latest.created_at) {
          const latestTime = new Date(latest.created_at).getTime();
          const tenHoursAgo = latestTime - STILL_HOURS * 60 * 60 * 1000;

          const pointsWithinWindow = rows.filter(row => {
            const t = new Date(row.created_at).getTime();
            return !Number.isNaN(t) && t >= tenHoursAgo && t <= latestTime;
          });

          const oldestInWindow = pointsWithinWindow[pointsWithinWindow.length - 1];

          if (
            oldestInWindow &&
            latest.lat != null &&
            latest.lon != null &&
            oldestInWindow.lat != null &&
            oldestInWindow.lon != null
          ) {
            const oldestTime = new Date(oldestInWindow.created_at).getTime();
            const diffHours = (latestTime - oldestTime) / (1000 * 60 * 60);

            if (diffHours >= STILL_HOURS) {
              const moved = distanceMeters(
                Number(oldestInWindow.lat),
                Number(oldestInWindow.lon),
                Number(latest.lat),
                Number(latest.lon)
              );

              if (moved < STILL_DISTANCE_M) {
                status = 'still';
                const stillKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-still`;
                pushNotification(
                  'warning',
                  'Zariadenie sa nepohlo viac ako 10 hodín.',
                  stillKey,
                  { lat: Number(latest.lat), lon: Number(latest.lon) }
                );
              }
            }
          }
        }

        // 🔥 EMAIL RAZ ZA HODINU (success)
        if (!lastHourlyRef.current || !sameHour(lastHourlyRef.current, now)) {
          lastHourlyRef.current = now;
          pushNotification('success', 'Zariadenie je v poriadku.');
        }

        if (mounted) {
          setCurrentStatus(status);
          setLoading(false);
        }
      } catch (err) {
        console.error('Neočakávaná chyba pri kontrole notifikácií:', err);
        if (mounted) setLoading(false);
      }
    };

    checkDeviceStatus();
    const interval = setInterval(checkDeviceStatus, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  if (!user) return null;

  const statusBox = () => {
    if (currentStatus === 'outside') return 'bg-red-50 border-red-200 text-red-700';
    if (currentStatus === 'still') return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    if (currentStatus === 'ok') return 'bg-green-50 border-green-200 text-green-700';
    return 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const statusText = () => {
    if (currentStatus === 'outside') return 'Zariadenie je von z ohrady';
    if (currentStatus === 'still') return 'Zariadenie sa nepohlo viac ako 10 hodín';
    if (currentStatus === 'ok') return 'Zariadenie je v poriadku';
    return 'Stav zariadenia nie je dostupný';
  };

  const notificationBox = (type: AppNotification['type']) => {
    if (type === 'success') return 'bg-green-50 border-green-200 text-green-800';
    if (type === 'warning') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const notificationIcon = (type: AppNotification['type']) => {
    if (type === 'success') return <CheckCircle2 className="w-5 h-5" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5" />;
    return <Siren className="w-5 h-5" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Horný box s info */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <div className="flex items-center gap-3 mb-3">
          <Bell className="w-7 h-7 text-green-600" />
          <h2 className="text-2xl font-semibold">Notifikácie zariadenia</h2>
        </div>

        <p className="text-gray-600">Zariadenie: <b>{DEVICE_ID}</b></p>
        <p className="text-gray-600">Účet: <b>{user.email}</b></p>
      </div>

      {/* Status box */}
      <div className={`border p-5 rounded-2xl ${statusBox()}`}>
        <div className="font-semibold text-lg">{statusText()}</div>
        {lastLocation && (
          <div className="text-sm mt-2">
            Posledná poloha: {Number(lastLocation.lat).toFixed(6)}, {Number(lastLocation.lon).toFixed(6)}
          </div>
        )}
        {lastChecked && (
          <div className="text-sm mt-1">
            Posledná kontrola: {new Date(lastChecked).toLocaleString('sk-SK')}
          </div>
        )}
      </div>

      {/* Virtuálna ohrada */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold mb-4">Virtuálna ohrada</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {fence.map((point, index) => (
            <div key={index} className="border rounded-xl p-3 bg-gray-50">
              <div className="font-medium">Bod {index + 1}</div>
              <div>Lat: {point.lat}</div>
              <div>Lon: {point.lon}</div>
            </div>
          ))}
        </div>
      </div>

      {/* História notifikácií */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold mb-4">História notifikácií</h3>
        {loading ? (
          <div className="text-gray-500">Načítavam notifikácie...</div>
        ) : notifications.length === 0 ? (
          <div className="text-gray-500">Zatiaľ žiadne notifikácie.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className={`border rounded-xl p-4 ${notificationBox(n.type)}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{notificationIcon(n.type)}</div>
                  <div className="flex-1">
                    <div className="font-medium">{n.text}</div>
                    <div className="text-xs mt-1 opacity-80">{new Date(n.createdAt).toLocaleString('sk-SK')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}