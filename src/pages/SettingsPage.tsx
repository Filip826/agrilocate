import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type GeofenceSettingRow = Database['public']['Tables']['geofence_settings']['Row'];

function clampNumber(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const FIXED_DEVICE_ID = 'krava_1';

export function SettingsPage() {
  const { user } = useAuth();

  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [radius, setRadius] = useState('200');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [savedMsg, setSavedMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadSettings = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('geofence_settings')
          .select('*')
          .eq('user_id', user.id)
          .eq('device_id', FIXED_DEVICE_ID)
          .maybeSingle();

        if (error) {
          console.error('Chyba pri načítaní settings:', error.message);
        }

        const row = data as GeofenceSettingRow | null;

        if (row) {
          setLat(String(row.receiver_lat));
          setLon(String(row.receiver_lon));
          setRadius(String(row.radius_m));
          setNotifyEmail(row.notify_email || user.email || '');
          setIsActive(Boolean(row.is_active));
        } else {
          setNotifyEmail(user.email || '');
        }
      } catch (err) {
        console.error('Neočakávaná chyba v loadSettings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  const validation = useMemo(() => {
    const latNum = Number(lat);
    const lonNum = Number(lon);
    const radiusNum = Number(radius);

    const errors: string[] = [];

    if (!Number.isFinite(latNum)) {
      errors.push('Latitude musí byť číslo.');
    }

    if (!Number.isFinite(lonNum)) {
      errors.push('Longitude musí byť číslo.');
    }

    if (Number.isFinite(latNum) && (latNum < -90 || latNum > 90)) {
      errors.push('Latitude musí byť v rozsahu -90 až 90.');
    }

    if (Number.isFinite(lonNum) && (lonNum < -180 || lonNum > 180)) {
      errors.push('Longitude musí byť v rozsahu -180 až 180.');
    }

    if (!Number.isFinite(radiusNum) || radiusNum <= 0) {
      errors.push('Vzdialenosť musí byť kladné číslo v metroch.');
    }

    if (!notifyEmail.trim()) {
      errors.push('Email je povinný.');
    }

    return {
      ok: errors.length === 0,
      errors,
      latNum,
      lonNum,
      radiusNum,
    };
  }, [lat, lon, radius, notifyEmail]);

  const onSave = async () => {
    if (!user || !validation.ok) return;

    const { data: existingRow, error: fetchError } = await supabase
      .from('geofence_settings')
      .select('id')
      .eq('user_id', user.id)
      .eq('device_id', FIXED_DEVICE_ID)
      .maybeSingle();

    if (fetchError) {
      setSavedMsg(`❌ Chyba pri načítaní: ${fetchError.message}`);
      setTimeout(() => setSavedMsg(''), 4000);
      return;
    }

    if (existingRow) {
      const { error: updateError } = await supabase
        .from('geofence_settings')
        .update({
          receiver_lat: validation.latNum,
          receiver_lon: validation.lonNum,
          radius_m: clampNumber(validation.radiusNum, 1, 500000),
          notify_email: notifyEmail.trim(),
          is_active: isActive,
        })
        .eq('id', existingRow.id);

      if (updateError) {
        setSavedMsg(`❌ Chyba pri ukladaní: ${updateError.message}`);
        setTimeout(() => setSavedMsg(''), 4000);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('geofence_settings').insert({
        user_id: user.id,
        device_id: FIXED_DEVICE_ID,
        receiver_lat: validation.latNum,
        receiver_lon: validation.lonNum,
        radius_m: clampNumber(validation.radiusNum, 1, 500000),
        notify_email: notifyEmail.trim(),
        is_active: isActive,
      });

      if (insertError) {
        setSavedMsg(`❌ Chyba pri ukladaní: ${insertError.message}`);
        setTimeout(() => setSavedMsg(''), 4000);
        return;
      }
    }

    setSavedMsg('✅ Nastavenia uložené do databázy');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow">
          Načítavam nastavenia...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold">Nastavenia geofence</h2>
        <p className="text-gray-600">
          Zariadenie: <b>{FIXED_DEVICE_ID}</b>
        </p>
        <p className="text-gray-600">
          Účet: <b>{user.email}</b>
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h3 className="text-lg font-semibold">GPS poloha receivera</h3>

        <input
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude (napr. 48.1486)"
          className="w-full border rounded-lg px-4 py-2"
        />

        <input
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder="Longitude (napr. 17.1077)"
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h3 className="text-lg font-semibold">Povolená vzdialenosť (m)</h3>

        <input
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          placeholder="napr. 200"
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h3 className="text-lg font-semibold">Email pre upozornenia</h3>

        <input
          value={notifyEmail}
          onChange={(e) => setNotifyEmail(e.target.value)}
          placeholder="napr. meno@email.com"
          className="w-full border rounded-lg px-4 py-2"
        />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>Zapnúť email upozornenia</span>
        </label>
      </div>

      {!validation.ok && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <ul className="list-disc list-inside">
            {validation.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {savedMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
          {savedMsg}
        </div>
      )}

      <button
        onClick={onSave}
        disabled={!validation.ok}
        className={`px-6 py-3 rounded-lg text-white font-medium ${
          validation.ok ? 'bg-green-600' : 'bg-gray-400'
        }`}
      >
        Uložiť nastavenia
      </button>
    </div>
  );
}