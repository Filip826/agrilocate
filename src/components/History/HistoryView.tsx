import { useState, useEffect } from 'react';
import { Database } from '../../lib/database.types';
import { HistoryMap } from '../Map/HistoryMap';

type Location = Database['public']['Tables']['locations']['Row'];

export function HistoryView({ locations }: { locations: Location[] }) {
  const [dateRange, setDateRange] =
    useState<'today' | '3days' | 'week' | '2weeks'>('today');

  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);

  useEffect(() => {
    const now = new Date();
    const from = new Date();

    if (dateRange === 'today') from.setHours(0, 0, 0, 0);
    if (dateRange === '3days') from.setDate(from.getDate() - 3);
    if (dateRange === 'week') from.setDate(from.getDate() - 7);
    if (dateRange === '2weeks') from.setDate(from.getDate() - 14);

    const filtered = locations
      .filter((l) => {
        const d = new Date(l.created_at);
        return d >= from && d <= now;
      })
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

    setFilteredLocations(filtered);
  }, [dateRange, locations]);

  return (
    <div className="space-y-4">
      {/* NADPIS */}
      <h2 className="text-2xl font-bold">História pohybu</h2>

      {/* FILTER */}
      <div className="grid grid-cols-4 gap-2 bg-gray-100 rounded-xl p-1 w-full">
        <FilterBtn
          label="Dnes"
          active={dateRange === 'today'}
          onClick={() => setDateRange('today')}
        />
        <FilterBtn
          label="3 dni"
          active={dateRange === '3days'}
          onClick={() => setDateRange('3days')}
        />
        <FilterBtn
          label="Týždeň"
          active={dateRange === 'week'}
          onClick={() => setDateRange('week')}
        />
        <FilterBtn
          label="2 týždne"
          active={dateRange === '2weeks'}
          onClick={() => setDateRange('2weeks')}
        />
      </div>

      {/* MAPA */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden h-[500px]">
        <HistoryMap locations={filteredLocations} />
      </div>
    </div>
  );
}

/* ================= BUTTON ================= */
function FilterBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3 rounded-lg font-medium transition ${
        active
          ? 'bg-green-600 text-white shadow'
          : 'text-gray-700 hover:bg-green-100'
      }`}
    >
      {label}
    </button>
  );
}
