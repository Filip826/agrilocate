'use client';

import { useState, useEffect, useMemo } from 'react';
import { HistoryMap } from '../Map/HistoryMap';
import { Database } from '../../lib/database.types';

type Location = Database['public']['Tables']['locations']['Row'];

function getTime(l: Location) {
  return String(l.created_at ?? '');
}

function getDeviceId(l: Location) {
  return String(l.device_id ?? 'unknown');
}

export function HistoryView({
  locations,
  devices,
}: {
  locations: Location[];
  devices: { id: string; name: string }[];
}) {
  const [dateRange, setDateRange] =
    useState<'today' | '3days' | 'week' | '2weeks'>('today');

  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);

  const safeLocations = Array.isArray(locations) ? locations : [];
  const safeDevices = Array.isArray(devices) ? devices : [];

  const deviceOptions = useMemo(() => {
    const ids = Array.from(new Set(safeLocations.map(getDeviceId)));

    return ids.map((id) => {
      const foundDevice = safeDevices.find(
        (d) => String(d.id).trim() === String(id).trim()
      );

      return {
        id: String(id).trim(),
        name: foundDevice?.name ?? `Zariadenie ${id}`,
      };
    });
  }, [safeDevices, safeLocations]);

  useEffect(() => {
    const now = new Date();
    const from = new Date();

    if (dateRange === 'today') from.setHours(0, 0, 0, 0);
    if (dateRange === '3days') from.setDate(from.getDate() - 3);
    if (dateRange === 'week') from.setDate(from.getDate() - 7);
    if (dateRange === '2weeks') from.setDate(from.getDate() - 14);

    // filter podľa zariadenia
    const deviceFiltered = safeLocations.filter((l) => {
      if (deviceFilter === 'all') return true;
      return String(getDeviceId(l)).trim() === String(deviceFilter).trim();
    });

    // zoradenie podľa času
    const sorted = [...deviceFiltered].sort((a, b) => {
      const timeA = new Date(getTime(a)).getTime();
      const timeB = new Date(getTime(b)).getTime();

      if (isNaN(timeA) && isNaN(timeB)) return 0;
      if (isNaN(timeA)) return 1;
      if (isNaN(timeB)) return -1;

      return timeA - timeB;
    });

    // posledná poloha
    const lastLocation = sorted.length ? sorted[sorted.length - 1] : null;

    // filter podľa dátumu
    const rangeFiltered = sorted.filter((l) => {
      const rawTime = getTime(l);
      const d = new Date(rawTime);

      if (isNaN(d.getTime())) return false;

      return d >= from && d <= now;
    });

    // ak posledná poloha nie je vo výsledku, pridaj ju
    const finalLocations =
      lastLocation &&
      !rangeFiltered.some(
        (l) =>
          String(getTime(l)) === String(getTime(lastLocation)) &&
          String(getDeviceId(l)).trim() ===
            String(getDeviceId(lastLocation)).trim()
      )
        ? [...rangeFiltered, lastLocation]
        : rangeFiltered;

    setFilteredLocations(finalLocations);
  }, [dateRange, deviceFilter, safeLocations]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">História pohybu</h2>

      <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="text-sm text-gray-600">Vyber zariadenie:</div>

        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 bg-white w-full md:w-[320px]"
        >
          <option value="all">Všetky zariadenia</option>
          {deviceOptions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

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

      <div className="bg-white rounded-lg shadow-md overflow-hidden h-[500px]">
        <HistoryMap locations={filteredLocations} />
      </div>

      {filteredLocations.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4">
          Pre toto zariadenie sa nenašli žiadne GPS dáta v zvolenom období.
        </div>
      )}
    </div>
  );
}

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