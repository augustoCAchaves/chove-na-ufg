import { fetchText, num, type WeatherSource } from "./types";

/**
 * Códigos de condição da WeatherAPI que indicam chuva de fato (garoa, chuva,
 * pancadas, trovoada com chuva). Os códigos "possible" ficam de fora.
 * https://www.weatherapi.com/docs/weather_conditions.json
 */
const RAIN_CODES = new Set([
  1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246, 1273,
  1276,
]);

export const weatherApi: WeatherSource = {
  id: "weatherapi",
  isConfigured: (env) => Boolean(env.WEATHERAPI_KEY),
  async fetchReading(lat, lon, env) {
    const url = `https://api.weatherapi.com/v1/current.json?key=${env.WEATHERAPI_KEY}&q=${lat},${lon}`;
    const raw = await fetchText(url);
    const current = JSON.parse(raw).current;
    if (!current) throw new Error("resposta sem o campo 'current'");

    const precipitationMm = num(current.precip_mm);
    const weatherCode = num(current.condition?.code);
    if (precipitationMm === null && weatherCode === null) {
      throw new Error("resposta sem precipitação nem código do tempo");
    }
    return {
      observedAt: num(current.last_updated_epoch),
      precipitationMm,
      weatherCode,
      isRaining: (precipitationMm ?? 0) > 0 || (weatherCode !== null && RAIN_CODES.has(weatherCode)),
      raw,
    };
  },
};
