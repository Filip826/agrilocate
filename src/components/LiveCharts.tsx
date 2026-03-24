import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type Location = {
  lat: number;
  lon: number;
  created_at: string;
};

function distance(a: Location, b: Location) {
  const dx = a.lat - b.lat;
  const dy = a.lon - b.lon;
  return Math.sqrt(dx * dx + dy * dy) * 111_000;
}

export function LiveCharts({ locations }: { locations: Location[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);

  const todayLocs = locations.filter(l =>
    l.created_at.startsWith(today)
  );

  const yesterdayLocs = locations.filter(l =>
    l.created_at.startsWith(yesterday)
  );

  // ================= HOURLY =================
  const hourlyActivity = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    points: todayLocs.filter(l =>
      new Date(l.created_at).getHours() === h
    ).length,
  }));

  const calcDistance = (locs: Location[]) => {
    let d = 0;
    for (let i = 1; i < locs.length; i++) {
      d += distance(locs[i - 1], locs[i]);
    }
    return Math.round(d);
  };

  const comparison = [
    {
      day: 'Včera',
      distance: calcDistance(yesterdayLocs),
      points: yesterdayLocs.length,
    },
    {
      day: 'Dnes',
      distance: calcDistance(todayLocs),
      points: todayLocs.length,
    },
  ];

  // ================= WEEKLY (Po–Ne) =================
  const sorted = [...locations].sort(
    (a, b) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
  );

  const weekMap: Record<string, number> = {};

  const now = new Date();
  const day = now.getDay(); // 0 = nedeľa

  // nájdi pondelok
  const monday = new Date(now);
  const diffToMonday = day === 0 ? -6 : 1 - day;
  monday.setDate(now.getDate() + diffToMonday);

  // vytvor Po → Ne
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const key = d.toISOString().slice(0, 10);
    weekMap[key] = 0;
  }

  // výpočet vzdialenosti
  sorted.forEach((point, i) => {
    if (i === 0) return;

    const date = point.created_at.slice(0, 10);
    if (!(date in weekMap)) return;

    const prev = sorted[i - 1];
    const dist = distance(prev, point);

    weekMap[date] += dist;
  });

  const weeklyData = Object.entries(weekMap).map(([date, dist]) => ({
    date,
    km: +(dist / 1000).toFixed(2),
  }));

  return (
    <>
      {/* ===== CIARA ===== */}
      <hr className="border-t-2 border-green-500 my-6" />

      {/* ===== 2 GRAFY ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ===== GRAF 1 ===== */}
        <div className="h-[300px]">
          <h3 className="text-lg font-medium mb-2">
            Aktivita počas dňa (dnes)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="points"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ===== GRAF 2 ===== */}
        <div className="h-[300px]">
          <h3 className="text-lg font-medium mb-2">
            Včera vs. dnes – porovnanie
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison} barCategoryGap={30} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="distance"
                fill="#16a34a"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="points"
                fill="#92400e"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== MEDZERA ===== */}
      <div className="h-6" />

      {/* ===== GRAF 3 ===== */}
      <div className="w-full h-[300px]">
        <h3 className="text-lg font-medium mb-2">
          Aktivita (pondelok – nedeľa)
        </h3>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tickFormatter={(d) =>
                new Date(d).toLocaleDateString('sk-SK', {
                  weekday: 'short',
                })
              }
            />

            <YAxis unit=" km" />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="km"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ===== MEDZERA ===== */}
      <div className="h-6" />
    </>
  );
}