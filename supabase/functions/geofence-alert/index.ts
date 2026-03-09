import { createClient } from 'npm:@supabase/supabase-js@2';

type LocationRow = {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: string;
};

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: LocationRow | null;
  old_record: LocationRow | null;
};

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    if (payload.type !== 'INSERT' || !payload.record) {
      return new Response(JSON.stringify({ ok: true, skipped: 'not insert' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const location = payload.record;

    if (
      !location.device_id ||
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number'
    ) {
      return new Response(JSON.stringify({ ok: true, skipped: 'invalid record' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: settings, error: settingsError } = await supabase
      .from('geofence_settings')
      .select('*')
      .eq('device_id', location.device_id)
      .eq('is_active', true);

    if (settingsError) {
      return new Response(
        JSON.stringify({ ok: false, error: settingsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!settings || settings.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no settings' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    for (const s of settings) {
      const distance = haversineMeters(
        Number(s.receiver_lat),
        Number(s.receiver_lon),
        location.latitude,
        location.longitude
      );

      const isOutside = distance > Number(s.radius_m);
      const lastState = s.last_state as 'inside' | 'outside' | null;

      if (isOutside) {
        if (lastState !== 'outside') {
          const subject = `Upozornenie: ${location.device_id} je mimo zóny`;

          const html = `
            <h2>GPS upozornenie</h2>
            <p>Zariadenie <b>${location.device_id}</b> prekročilo nastavenú vzdialenosť.</p>
            <p><b>Nameraná vzdialenosť:</b> ${Math.round(distance)} m</p>
            <p><b>Povolená vzdialenosť:</b> ${Math.round(Number(s.radius_m))} m</p>
            <p><b>Poloha sendera:</b> ${location.latitude}, ${location.longitude}</p>
            <p><b>Poloha receivera:</b> ${s.receiver_lat}, ${s.receiver_lon}</p>
            <p><b>Čas:</b> ${location.timestamp}</p>
          `;

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: Deno.env.get('ALERT_FROM_EMAIL'),
              to: [s.notify_email],
              subject,
              html,
            }),
          });

          if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error('Resend error:', errorText);
          }

          await supabase
            .from('geofence_settings')
            .update({
              last_state: 'outside',
              last_alert_sent_at: new Date().toISOString(),
            })
            .eq('id', s.id);
        }
      } else {
        await supabase
          .from('geofence_settings')
          .update({
            last_state: 'inside',
          })
          .eq('id', s.id);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});