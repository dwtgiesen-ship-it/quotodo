// Weather lookup via Open-Meteo (free, no API key).
// Within the 16-day forecast window we use the real forecast; further out we
// fall back to the same dates last year as a climate indication.

export type DayWeather = {
  date: string;
  summary: string;
  maxC: number | null;
  minC: number | null;
  morningC: number | null; // 08:00 local
  afternoonC: number | null; // 14:00
  eveningC: number | null; // 21:00
  rainChancePct: number | null;
  rainMm: number | null;
  windKmh: number | null;
  uvIndex: number | null;
  seaC: number | null;
  sunset: string | null;
};

export type WeatherReport = {
  place: string;
  country: string;
  region: string;
  timezone: string;
  source: "forecast" | "last-year";
  note: string;
  days: DayWeather[];
};

const WMO: Record<number, string> = {
  0: "onbewolkt",
  1: "overwegend zonnig",
  2: "half bewolkt",
  3: "bewolkt",
  45: "mist",
  48: "rijpmist",
  51: "lichte motregen",
  53: "motregen",
  55: "dichte motregen",
  61: "lichte regen",
  63: "regen",
  65: "zware regen",
  66: "ijzel",
  67: "zware ijzel",
  71: "lichte sneeuw",
  73: "sneeuw",
  75: "zware sneeuw",
  77: "sneeuwkorrels",
  80: "lichte buien",
  81: "buien",
  82: "zware buien",
  85: "sneeuwbuien",
  86: "zware sneeuwbuien",
  95: "onweer",
  96: "onweer met hagel",
  99: "zwaar onweer met hagel",
};

const FORECAST_DAYS = 16;

type Geo = { name: string; latitude: number; longitude: number; country?: string; admin1?: string; timezone?: string };

async function getJson<T>(url: string, attempt = 0): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (res.status >= 500 && attempt < 2) {
    // Open-Meteo occasionally hiccups with a 502/503; a short retry fixes it.
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    return getJson<T>(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`Weerdienst gaf ${res.status} voor ${new URL(url).host}`);
  return (await res.json()) as T;
}

export async function geocode(place: string, countryCode?: string): Promise<Geo | null> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", place);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "nl");
  if (countryCode) url.searchParams.set("countryCode", countryCode.toUpperCase());
  const data = await getJson<{ results?: Geo[] }>(url.toString());
  return data.results?.[0] ?? null;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}

function shiftYear(iso: string, years: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  // Clamp 29 Feb → 28 Feb when the target year isn't a leap year.
  const day = m === 2 && d === 29 ? 28 : d;
  return `${y + years}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type Daily = {
  time: string[];
  weather_code?: (number | null)[];
  temperature_2m_max?: (number | null)[];
  temperature_2m_min?: (number | null)[];
  precipitation_probability_max?: (number | null)[];
  precipitation_sum?: (number | null)[];
  wind_speed_10m_max?: (number | null)[];
  uv_index_max?: (number | null)[];
  sunset?: (string | null)[];
};
type Hourly = { time: string[]; temperature_2m?: (number | null)[] };

function hourValue(hourly: Hourly | undefined, date: string, hour: number, key: "temperature_2m" = "temperature_2m") {
  if (!hourly?.[key]) return null;
  const idx = hourly.time.indexOf(`${date}T${String(hour).padStart(2, "0")}:00`);
  const v = idx >= 0 ? hourly[key]![idx] : null;
  return v == null ? null : Math.round(v);
}

function round(v: number | null | undefined): number | null {
  return v == null ? null : Math.round(v);
}

export async function getWeather(opts: {
  place: string;
  countryCode?: string;
  startDate: string;
  endDate: string;
}): Promise<WeatherReport> {
  const geo = await geocode(opts.place, opts.countryCode);
  if (!geo) throw new Error(`Plaats "${opts.place}" niet gevonden. Probeer een grotere plaats in de buurt.`);

  const today = isoDate(new Date());
  const start = opts.startDate < today ? today : opts.startDate;
  let end = opts.endDate < start ? start : opts.endDate;
  if (addDays(start, 30) < end) end = addDays(start, 30); // keep reports short

  const lastForecastDay = addDays(today, FORECAST_DAYS - 1);
  const useForecast = end <= lastForecastDay;

  const daily = [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "wind_speed_10m_max",
    ...(useForecast ? ["precipitation_probability_max", "uv_index_max", "sunset"] : []),
  ].join(",");

  let dailyData: Daily;
  let hourlyData: Hourly | undefined;
  let queryStart = start;

  if (useForecast) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(geo.latitude),
      longitude: String(geo.longitude),
      daily,
      hourly: "temperature_2m",
      timezone: "auto",
      start_date: start,
      end_date: end,
    }).toString();
    const data = await getJson<{ daily: Daily; hourly: Hourly }>(url.toString());
    dailyData = data.daily;
    hourlyData = data.hourly;
  } else {
    queryStart = shiftYear(start, -1);
    const url = new URL("https://archive-api.open-meteo.com/v1/archive");
    url.search = new URLSearchParams({
      latitude: String(geo.latitude),
      longitude: String(geo.longitude),
      daily,
      hourly: "temperature_2m",
      timezone: "auto",
      start_date: queryStart,
      end_date: shiftYear(end, -1),
    }).toString();
    const data = await getJson<{ daily: Daily; hourly: Hourly }>(url.toString());
    dailyData = data.daily;
    hourlyData = data.hourly;
  }

  // Sea temperature is a nice-to-have for beach trips; ignore failures (inland places have none).
  let sea: Hourly | undefined;
  if (useForecast) {
    try {
      const url = new URL("https://marine-api.open-meteo.com/v1/marine");
      url.search = new URLSearchParams({
        latitude: String(geo.latitude),
        longitude: String(geo.longitude),
        hourly: "sea_surface_temperature",
        timezone: "auto",
        start_date: start,
        end_date: end,
      }).toString();
      const data = await getJson<{ hourly: { time: string[]; sea_surface_temperature?: (number | null)[] } }>(url.toString());
      sea = { time: data.hourly.time, temperature_2m: data.hourly.sea_surface_temperature };
    } catch {
      sea = undefined;
    }
  }

  const days: DayWeather[] = dailyData.time.map((sourceDate, i) => {
    const date = useForecast ? sourceDate : addDays(start, i);
    const code = dailyData.weather_code?.[i];
    return {
      date,
      summary: code != null ? (WMO[code] ?? `weercode ${code}`) : "onbekend",
      maxC: round(dailyData.temperature_2m_max?.[i]),
      minC: round(dailyData.temperature_2m_min?.[i]),
      morningC: hourValue(hourlyData, sourceDate, 8),
      afternoonC: hourValue(hourlyData, sourceDate, 14),
      eveningC: hourValue(hourlyData, sourceDate, 21),
      rainChancePct: round(dailyData.precipitation_probability_max?.[i]),
      rainMm: dailyData.precipitation_sum?.[i] ?? null,
      windKmh: round(dailyData.wind_speed_10m_max?.[i]),
      uvIndex: round(dailyData.uv_index_max?.[i]),
      seaC: hourValue(sea, sourceDate, 14),
      sunset: dailyData.sunset?.[i]?.slice(11, 16) ?? null,
    };
  });

  return {
    place: geo.name,
    country: geo.country ?? "",
    region: geo.admin1 ?? "",
    timezone: geo.timezone ?? "",
    source: useForecast ? "forecast" : "last-year",
    note: useForecast
      ? "Actuele weersverwachting (Open-Meteo)."
      : `Verder dan ${FORECAST_DAYS} dagen vooruit: dit is het weer op dezelfde data vorig jaar (${queryStart}), gebruik het als klimaat-indicatie.`,
    days,
  };
}
