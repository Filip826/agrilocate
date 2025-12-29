import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { device_id, api_key, latitude, longitude, altitude, speed, accuracy } = body;

    if (!device_id || !api_key || latitude == null || longitude == null) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const { data: device } = await supabase
      .from('devices')
      .select('*')
      .eq('device_id', device_id)
      .eq('api_key', api_key)
      .maybeSingle();

    if (!device) {
      return new Response(JSON.stringify({ error: 'Invalid device or api key' }), { status: 401 });
    }

    await supabase.from('locations').insert({
      device_id: device.id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      altitude: altitude ? Number(altitude) : null,
      speed: speed ? Number(speed) : null,
      accuracy: accuracy ? Number(accuracy) : null,
    });

    await supabase.from('devices').update({
      is_online: true,
      last_seen: new Date().toISOString(),
    }).eq('id', device.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
