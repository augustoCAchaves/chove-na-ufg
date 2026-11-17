import { fetchText, num, type WeatherSource } from "./types";

/**
 * Códigos de condição que indicam chuva: trovoada com chuva/garoa (200-202,
 * 230-232), garoa (3xx) e chuva (5xx).
 * https://openweathermap.org/weather-conditions
 */
function isRainCode(id: number): boolean {
  return (id >= 200 && id <= 202) || (id >= 230 && id <= 232) || (id >= 300 && id <= 399) || (id >= 500 && id <= 599);
}

export const openWeatherMap: WeatherSource = {
  id: "openweathermap",
  isConfigured: (env) => Boolean(env.OPENWEATHER_KEY),
  async fetchReading(lat, lon, env) {
    const url =
      "https://api.openweathermap.org/data/2.5/weather" +
      `?lat=${lat}&lon=${lon}&units=metric&appid=${env.OPENWEATHER_KEY}`;
    const raw = await fetchText(url);
    const data = JSON.parse(raw);
    if (!Array.isArray(data.weather) || data.weather.length === 0) {
      throw new Error("resposta sem o campo 'weather'");
    }
    const codes: number[] = data.weather.map((w: { id?: unknown }) => num(w.id)).filter((c: number | null) => c !== null);

    return {
      observedAt: num(data.dt),
      // 'rain.1h' é o acumulado da última hora e some da resposta quando não
      // choveu. Por cobrir uma hora inteira, não decide o "chove agora".
      precipitationMm: num(data.rain?.["1h"]) ?? 0,
      // A primeira condição é a principal.
      weatherCode: codes[0] ?? null,
      isRaining: codes.some(isRainCode),
      raw,
    };
  },
};
