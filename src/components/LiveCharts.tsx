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

  return (
    <>
      {/* ===== CIARA MEDZI MAPOU A GRAFMI ===== */}
      <hr className="border-t-2 border-green-500 my-6" />

      {/* ===== GRAFY ===== */}
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
                stroke="#16a34a"   // 🟢 ZELENÁ ČIARA
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
            Dnes vs. včera – porovnanie
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparison}
              barCategoryGap={30}
              barGap={8}
            >
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

      {/* ===== MEDZERA POD GRAFMI ===== */}
      <div className="h-6" />
    </>
  );
}
