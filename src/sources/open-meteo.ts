import { fetchText, num, type WeatherSource } from "./types";

/**
 * Códigos WMO que contam como chuva: garoa (51-57), chuva (61-67),
 * pancadas (80-82) e trovoada (95-99).
 * https://open-meteo.com/en/docs
 */
function isRainCode(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);
}

export const openMeteo: WeatherSource = {
  id: "open-meteo",
  isConfigured: () => true,
  async fetchReading(lat, lon) {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${lat}&longitude=${lon}` +
      "&current=precipitation,rain,showers,weather_code&timeformat=unixtime";
    const raw = await fetchText(url);
    const current = JSON.parse(raw).current;
    if (!current) throw new Error("resposta sem o campo 'current'");

    // 'precipitation' é a soma dos últimos 'interval' segundos (900 = 15 min).
    const precipitationMm = num(current.precipitation);
    const weatherCode = num(current.weather_code);
    if (precipitationMm === null && weatherCode === null) {
      throw new Error("resposta sem precipitação nem código do tempo");
    }
    return {
      observedAt: num(current.time),
      precipitationMm,
      weatherCode,
      isRaining: (precipitationMm ?? 0) > 0 || (weatherCode !== null && isRainCode(weatherCode)),
      raw,
    };
  },
};
