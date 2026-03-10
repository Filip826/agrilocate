// ================== SUPABASE ==================
const supabaseUrl = 'https://qsdcgqllaaovuhicoqiw.supabase.co/rest/v1/locations';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzZGNncWxsYWFvdnVoaWNvcWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDM4MjcsImV4cCI6MjA4MTg3OTgyN30.t8iKZhQ4LU_MNuVEROpGQDOMY5tO02kDhhqPxkpj10s';

// ================== ZARIADENIE ==================
const deviceId = 'krava_1';

// ================== HRANICE POLYGONU ==================
const fence = [
  { lat: 48.97702, lon: 20.41976 },
  { lat: 48.97855, lon: 20.42252 },
  { lat: 48.97669, lon: 20.42653 },
  { lat: 48.97474, lon: 20.42607 }
];

// ================== KRMELEC ==================
const feeder = { lat: 48.97730, lon: 20.42220 };

// ================== NASTAVENIA SPRÁVANIA ==================
// nočný spánok: 22:00 - 05:00
const NIGHT_SLEEP_START_HOUR = 22;
const NIGHT_SLEEP_END_HOUR = 5;

// interval posielania
const MIN_DELAY_SEC = 30;
const MAX_DELAY_SEC = 40;

// pri krmelci nech zostane dlhšie
const FEEDING_MIN_TICKS = 10;
const FEEDING_MAX_TICKS = 18;

// nočný spánok minimálne 5 hodín
const NIGHT_SLEEP_MIN_HOURS = 5;

// koľko približne odoslaní za 5 hodín pri 30-40 s intervale
const NIGHT_SLEEP_MIN_TICKS = 450;
const NIGHT_SLEEP_MAX_TICKS = 600;

// ================== POMOCNÉ FUNKCIE ==================
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function distance(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lon - b.lon;
  return Math.sqrt(dx * dx + dy * dy);
}

function isInsidePolygon(lat, lon, polygon) {
  let inside = false;
  let j = polygon.length - 1;

  for (let i = 0; i < polygon.length; i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lon;
    const xj = polygon[j].lat;
    const yj = polygon[j].lon;

    const intersect =
      ((yi > lon) !== (yj > lon)) &&
      (lat < ((xj - xi) * (lon - yi)) / ((yj - yi) || 0.0000001) + xi);

    if (intersect) inside = !inside;
    j = i;
  }

  return inside;
}

function getBounds(points) {
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  };
}

const bounds = getBounds(fence);

function randomPointInsidePolygon() {
  while (true) {
    const lat = rand(bounds.minLat, bounds.maxLat);
    const lon = rand(bounds.minLon, bounds.maxLon);

    if (isInsidePolygon(lat, lon, fence)) {
      return {
        lat: Number(lat.toFixed(6)),
        lon: Number(lon.toFixed(6)),
      };
    }
  }
}

function jitter(scaleLat, scaleLon) {
  return {
    lat: rand(-scaleLat, scaleLat),
    lon: rand(-scaleLon, scaleLon),
  };
}

function moveToward(current, target, factor) {
  return {
    lat: current.lat + (target.lat - current.lat) * factor,
    lon: current.lon + (target.lon - current.lon) * factor,
  };
}

function getCurrentHour() {
  return new Date().getHours();
}

function isNightSleepTime() {
  const hour = getCurrentHour();
  return hour >= NIGHT_SLEEP_START_HOUR || hour < NIGHT_SLEEP_END_HOUR;
}

// ================== STAVY KRAVY ==================
const STATES = {
  GRAZING: 'PASIE_SA',
  WALKING: 'CHODI',
  RESTING: 'ODDYCHUJE',
  SLEEPING: 'SPI',
  FEEDING: 'PRI_KRMELCI',
};

let currentPosition = randomPointInsidePolygon();
let currentState = STATES.GRAZING;
let target = randomPointInsidePolygon();
let stateTicks = randInt(3, 8);

function pickState() {
  // v noci spi
  if (isNightSleepTime()) {
    return STATES.SLEEPING;
  }

  const r = Math.random();

  if (r < 0.35) return STATES.GRAZING;
  if (r < 0.60) return STATES.WALKING;
  if (r < 0.80) return STATES.FEEDING;
  if (r < 0.93) return STATES.RESTING;
  return STATES.SLEEPING;
}

function pickTarget() {
  if (Math.random() < 0.45) {
    return { ...feeder };
  }

  return randomPointInsidePolygon();
}

function updateState() {
  stateTicks--;

  if (stateTicks > 0) return;

  currentState = pickState();

  switch (currentState) {
    case STATES.SLEEPING:
      // v noci spi aspoň 5 hodín
      if (isNightSleepTime()) {
        stateTicks = randInt(NIGHT_SLEEP_MIN_TICKS, NIGHT_SLEEP_MAX_TICKS);
      } else {
        stateTicks = randInt(20, 40);
      }
      target = { ...currentPosition };
      break;

    case STATES.RESTING:
      stateTicks = randInt(8, 16);
      target = { ...currentPosition };
      break;

    case STATES.FEEDING:
      // pri krmelci bude dlhšie
      stateTicks = randInt(FEEDING_MIN_TICKS, FEEDING_MAX_TICKS);
      target = { ...feeder };
      break;

    case STATES.WALKING:
      stateTicks = randInt(4, 8);
      target = pickTarget();
      break;

    case STATES.GRAZING:
    default:
      stateTicks = randInt(5, 10);
      target = pickTarget();
      break;
  }
}

function simulateCow() {
  updateState();

  let next = { ...currentPosition };

  if (currentState === STATES.SLEEPING) {
    const j = jitter(0.000001, 0.000001);
    next.lat += j.lat;
    next.lon += j.lon;
  } else if (currentState === STATES.RESTING) {
    const j = jitter(0.000004, 0.000004);
    next.lat += j.lat;
    next.lon += j.lon;
  } else if (currentState === STATES.FEEDING) {
    next = moveToward(currentPosition, target, 0.06);
    const j = jitter(0.000004, 0.000004);
    next.lat += j.lat;
    next.lon += j.lon;
  } else if (currentState === STATES.WALKING) {
    next = moveToward(currentPosition, target, 0.10);
    const j = jitter(0.000010, 0.000010);
    next.lat += j.lat;
    next.lon += j.lon;
  } else {
    // PASIE_SA
    next = moveToward(currentPosition, target, 0.08);
    const j = jitter(0.000008, 0.000008);
    next.lat += j.lat;
    next.lon += j.lon;
  }

  // Ak by vyšiel mimo hranice, vráť ho dnu
  if (!isInsidePolygon(next.lat, next.lon, fence)) {
    next = randomPointInsidePolygon();
  }

  // Keď príde blízko k cieľu, vyber nový cieľ
  if (
    currentState !== STATES.SLEEPING &&
    currentState !== STATES.RESTING &&
    distance(next, target) < 0.00012
  ) {
    target = pickTarget();
  }

  currentPosition = {
    lat: Number(next.lat.toFixed(6)),
    lon: Number(next.lon.toFixed(6)),
  };

  return {
    ...currentPosition,
    state: currentState,
    inside_zone: isInsidePolygon(currentPosition.lat, currentPosition.lon, fence),
  };
}

// ================== ULOŽENIE DO SUPABASE ==================
async function sendPoint() {
  const point = simulateCow();

  const body = {
    device_id: deviceId,
    lat: point.lat,
    lon: point.lon,
  };

  try {
    const res = await fetch(supabaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });

    const responseText = await res.text();

    console.log(
      `[${new Date().toLocaleTimeString()}] ${point.state} | LAT=${point.lat} | LON=${point.lon} | ${point.inside_zone ? 'VNUTRI' : 'MIMO'} | status=${res.status} | ticks=${stateTicks}`
    );

    if (!res.ok) {
      console.log('SUPABASE ERROR:', responseText);
    }
  } catch (err) {
    console.error('Chyba pri odosielani:', err.message);
  }

  const delay = randInt(MIN_DELAY_SEC, MAX_DELAY_SEC) * 1000;
  setTimeout(sendPoint, delay);
}

console.log('Simulator kravy spusteny');
console.log(`Zariadenie: ${deviceId}`);
console.log('Ukladanie priamo do Supabase...');
console.log('Krava sa pohybuje len vo vnútri hranice.');
console.log(`Nočný spánok: ${NIGHT_SLEEP_START_HOUR}:00 - ${NIGHT_SLEEP_END_HOUR}:00`);
console.log('Pri krmelci zostáva dlhšie.');
sendPoint();