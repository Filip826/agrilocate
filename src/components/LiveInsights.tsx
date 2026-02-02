import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

type Location = {
  lat: number;
  lon: number;
  created_at: string;
};

export function LiveInsights({ locations }: { locations: Location[] }) {
  if (locations.length < 2) return null;

  // ===== DNES =====
  const today = new Date().toISOString().slice(0, 10);
  const todayLocs = locations.filter(l =>
    l.created_at.startsWith(today)
  );

  // ===== VČERA =====
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  const yesterdayLocs = locations.filter(l =>
    l.created_at.startsWith(yStr)
  );

  // ===== VZDIALENOSŤ =====
  const distance = (locs: Location[]) => {
    let d = 0;
    for (let i = 1; i < locs.length; i++) {
      const dx = locs[i].lat - locs[i - 1].lat;
      const dy = locs[i].lon - locs[i - 1].lon;
      d += Math.sqrt(dx * dx + dy * dy) * 111_000;
    }
    return d;
  };

  const todayDist = distance(todayLocs);
  const yesterdayDist = distance(yesterdayLocs);

  const diff =
    yesterdayDist > 0
      ? ((todayDist - yesterdayDist) / yesterdayDist) * 100
      : 0;

  // ===== AKTIVITA PO HODINÁCH =====
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    value: 0,
  }));

  for (let i = 1; i < todayLocs.length; i++) {
    const h = new Date(todayLocs[i].created_at).getHours();
    const dx = todayLocs[i].lat - todayLocs[i - 1].lat;
    const dy = todayLocs[i].lon - todayLocs[i - 1].lon;
    hourly[h].value += Math.sqrt(dx * dx + dy * dy) * 111_000;
  }

  const maxHour = hourly.reduce((a, b) =>
    b.value > a.value ? b : a
  );

  return (
    <div className="mt-6 space-y-6">
      {/* TEXT INFO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Info label="Dnes prejdené" value={`${todayDist.toFixed(0)} m`} />
        <Info
          label="Zmena oproti včera"
          value={`${diff >= 0 ? '+' : ''}${diff.toFixed(1)} %`}
        />
        <Info
          label="Najaktívnejšia hodina"
          value={maxHour.hour}
        />
        <a
          href={`https://www.google.com/maps?q=${locations[0].lat},${locations[0].lon}`}
          target="_blank"
          className="text-blue-600 underline"
        >
          Navigovať →
        </a>
      </div>

      {/* GRAF – HODINY */}
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={hourly}>
            <XAxis dataKey="hour" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* GRAF – DNES VS VČERA */}
      <div className="h-48">
        <ResponsiveContainer>
          <LineChart
            data={[
              { day: 'Včera', value: yesterdayDist },
              { day: 'Dnes', value: todayDist },
            ]}
          >
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line dataKey="value" stroke="#16a34a" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
