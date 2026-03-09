import { Database } from '../lib/database.types';

type Location = Database['public']['Tables']['locations']['Row'];

export function LiveStats({ locations }: { locations: Location[] }) {
  if (!locations || locations.length < 2) {
    return <div className="mt-6 text-gray-500">Nedostatok GPS dát</div>;
  }

  // ================= SORT =================
  const sorted = [...locations].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  // ================= TODAY / YESTERDAY =================
  const today = new Date().toISOString().slice(0, 10);

  const todayPoints = sorted.filter((l) => l.created_at.startsWith(today));

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const yesterdayPoints = sorted.filter((l) =>
    l.created_at.startsWith(yesterdayStr)
  );

  // ================= DISTANCE FUNCTION =================
  // vracia METRE
  const calcDistanceMeters = (points: Location[]) => {
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].lat - points[i - 1].lat;
      const dy = points[i].lon - points[i - 1].lon;
      dist += Math.sqrt(dx * dx + dy * dy) * 111_000; // m
    }
    return dist; // m
  };

  // ✅ TRASA (prejdená vzdialenosť)
  const todayDistanceM = calcDistanceMeters(todayPoints); // m
  const yesterdayDistanceM = calcDistanceMeters(yesterdayPoints); // m
  const totalDistanceM = calcDistanceMeters(sorted); // m (celá doba)

  const diff =
    yesterdayDistanceM > 0
      ? ((todayDistanceM - yesterdayDistanceM) / yesterdayDistanceM) * 100
      : 0;

  // ================= MOST ACTIVE HOUR =================
  const hourMap: Record<number, number> = {};

  todayPoints.forEach((l, i) => {
    if (i === 0) return;
    const h = new Date(l.created_at).getHours();
    const prev = todayPoints[i - 1];
    const dx = l.lat - prev.lat;
    const dy = l.lon - prev.lon;
    const d = Math.sqrt(dx * dx + dy * dy) * 111_000; // m
    hourMap[h] = (hourMap[h] || 0) + d;
  });

  const mostActiveHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];

  // ================= DIRECT DISTANCE =================
  // ✅ Priamy presun (od prvej po poslednú polohu) v metroch
  const directDistanceM =
    Math.sqrt(Math.pow(last.lat - first.lat, 2) + Math.pow(last.lon - first.lon, 2)) *
    111_000; // m

  const googleMapsUrl = `https://www.google.com/maps?q=${last.lat},${last.lon}`;

  // ================= STATUS =================
  const status =
    todayDistanceM < 50
      ? '🔴 Nízka aktivita'
      : todayDistanceM < 300
      ? '🟠 Slabá aktivita'
      : '🟢 Normálna aktivita';

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-xl font-bold">Prehľad aktivity</h3>

      <table className="w-full text-sm border-collapse">
        <tbody>
          <Row label="Stav zvieraťa" value={status} />

          {/* ✅ POSUN ZA DEŇ V METROCH */}
          <Row
            label="Posun za deň (dnes)"
            value={`${Math.round(todayDistanceM)} m`}
          />

          {/* ✅ POSUN ZA CELÚ DOBU V KM */}
          <Row
            label="Posun za celú dobu"
            value={`${(totalDistanceM / 1000).toFixed(2)} km`}
          />

         

          <Row
            label="Zmena oproti včerajšku"
            value={
              yesterdayDistanceM === 0
                ? '—'
                : diff >= 0
                ? `🟢 +${diff.toFixed(1)} %`
                : `🔴 ${diff.toFixed(1)} %`
            }
          />

          <Row
            label="Najaktívnejšia hodina"
            value={
              mostActiveHour
                ? `${mostActiveHour[0]}:00 – ${(mostActiveHour[1] / 1000).toFixed(
                    2
                  )} km`
                : '—'
            }
          />

          <Row label="Počet GPS bodov" value={sorted.length} />
          <Row
            label="Posledná poloha"
            value={`${last.lat.toFixed(6)}, ${last.lon.toFixed(6)}`}
          />
        </tbody>
      </table>

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
      >
        Navigovať
      </a>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <tr className="border-b last:border-none">
      <td className="py-2 font-medium text-gray-700">{label}</td>
      <td className="py-2 text-right">{value}</td>
    </tr>
  );
}